import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET teacher's busy time slots
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const { id: teacherId } = await params;

        // Get all sessions for this teacher via ClassTeacher -> Class -> Sessions
        const classTeachers = await prisma.classTeacher.findMany({
            where: { teacherId },
            include: {
                class: {
                    select: {
                        name: true,
                        sessionDuration: true,
                        sessions: {
                            select: {
                                id: true,
                                date: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        });

        // Build busy slots: start = session.date, end = session.date + sessionDuration minutes
        const busySlots = classTeachers.flatMap((ct) =>
            ct.class.sessions.map((s) => {
                const start = new Date(s.date);
                const end = new Date(start.getTime() + ct.class.sessionDuration * 60 * 1000);
                return {
                    start: start.toISOString(),
                    end: end.toISOString(),
                    className: ct.class.name,
                    sessionTitle: s.title,
                };
            })
        );

        return NextResponse.json({ busySlots }, { status: 200 });
    } catch (error) {
        console.error("Get teacher schedule error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت برنامه معلم" },
            { status: 500 }
        );
    }
}
