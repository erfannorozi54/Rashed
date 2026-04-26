import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET all classes where the current teacher is assigned (all classTypes including PRIVATE)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const classes = await prisma.class.findMany({
            where: {
                teachers: {
                    some: { teacherId: session.user.id },
                },
            },
            include: {
                teachers: {
                    include: {
                        teacher: {
                            select: { id: true, name: true },
                        },
                    },
                },
                students: {
                    select: { studentId: true },
                },
                sessions: {
                    orderBy: { date: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const now = new Date();

        const formattedClasses = classes.map((cls) => {
            const upcomingSessions = cls.sessions.filter((s) => new Date(s.date) >= now);
            const nextSession = upcomingSessions[0] || null;
            const latestSession = cls.sessions[cls.sessions.length - 1] || null;

            return {
                id: cls.id,
                name: cls.name,
                description: cls.description,
                classType: cls.classType,
                sessionDuration: cls.sessionDuration,
                sessionPrice: cls.sessionPrice,
                maxCapacity: cls.maxCapacity,
                teachers: cls.teachers.map((t) => t.teacher),
                studentCount: cls.students.length,
                nextSession,
                latestSession,
                createdAt: cls.createdAt,
            };
        });

        return NextResponse.json({ classes: formattedClasses });
    } catch (error) {
        console.error("Get teacher classes error:", error);
        return NextResponse.json({ error: "خطا در دریافت کلاسها" }, { status: 500 });
    }
}
