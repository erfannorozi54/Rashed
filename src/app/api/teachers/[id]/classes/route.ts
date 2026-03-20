import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { id: teacherId } = await params;

        const classes = await prisma.class.findMany({
            where: {
                classType: { in: ["PUBLIC", "SEMI_PRIVATE"] },
                teachers: { some: { teacherId } },
            },
            include: {
                sessions: {
                    orderBy: { date: "asc" },
                    take: 1,
                    where: { date: { gte: new Date() }, cancelled: false },
                },
                students: { select: { studentId: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const result = classes.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            classType: c.classType,
            maxCapacity: c.maxCapacity,
            sessionPrice: c.sessionPrice,
            studentCount: c.students.length,
            nextSession: c.sessions[0] ? { date: c.sessions[0].date } : null,
        }));

        return NextResponse.json({ classes: result });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}
