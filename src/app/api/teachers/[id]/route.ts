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

        const { id } = await params;

        const teacher = await prisma.user.findUnique({
            where: { id, role: { in: ["TEACHER", "ADMIN"] } },
            select: { id: true, name: true, role: true },
        });

        if (!teacher) {
            return NextResponse.json({ error: "استاد یافت نشد" }, { status: 404 });
        }

        const specializations = await (prisma as any).teacherSpecialization.findMany({
            where: { teacherId: id },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ teacher: { ...teacher, specializations } });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}
