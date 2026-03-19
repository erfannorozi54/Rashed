import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const { id } = await params;

        const existing = await (prisma as any).teacherSpecialization.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "تخصص یافت نشد" }, { status: 404 });
        }

        await (prisma as any).teacherSpecialization.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در حذف تخصص" }, { status: 500 });
    }
}
