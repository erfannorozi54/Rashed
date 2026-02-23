import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const classes = await prisma.class.findMany({
            where: { classType: "PUBLIC" },
            include: {
                teachers: {
                    include: {
                        teacher: { select: { id: true, name: true } },
                    },
                },
                students: { select: { studentId: true, status: true } },
                sessions: { select: { id: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const formatted = classes.map((cls) => ({
            id: cls.id,
            name: cls.name,
            description: cls.description,
            sessionPrice: cls.sessionPrice,
            minSessionsToPay: cls.minSessionsToPay,
            maxCapacity: cls.maxCapacity,
            sessionDuration: cls.sessionDuration,
            sessionCount: cls.sessions.length,
            studentCount: cls.students.filter((s) => s.status === "ENROLLED").length,
            teachers: cls.teachers.map((t) => t.teacher),
        }));

        return NextResponse.json({ classes: formatted }, { status: 200 });
    } catch (error) {
        console.error("Get public classes error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت کلاس‌ها" },
            { status: 500 }
        );
    }
}
