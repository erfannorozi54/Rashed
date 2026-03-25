import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; specId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { id: teacherId, specId } = await params;

        if (session.user.role !== "ADMIN" && session.user.id !== teacherId) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const existing = await (prisma as any).teacherSpecialization.findUnique({ where: { id: specId } });
        if (!existing || existing.teacherId !== teacherId) {
            return NextResponse.json({ error: "تخصص یافت نشد" }, { status: 404 });
        }

        const body = await request.json();
        const { subject, grade, content, price } = body;

        if (!subject || !grade || !content || price === undefined || price === "" || Number(price) <= 0) {
            return NextResponse.json({ error: "تمام فیلدها الزامی هستند و قیمت باید بیشتر از صفر باشد" }, { status: 400 });
        }

        const updated = await (prisma as any).teacherSpecialization.update({
            where: { id: specId },
            data: {
                subject: subject.trim(),
                grade: grade.trim(),
                content: content.trim(),
                price: Number(price),
            },
        });

        return NextResponse.json({ specialization: updated });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در ویرایش تخصص" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string; specId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { id: teacherId, specId } = await params;

        if (session.user.role !== "ADMIN" && session.user.id !== teacherId) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const existing = await (prisma as any).teacherSpecialization.findUnique({ where: { id: specId } });
        if (!existing || existing.teacherId !== teacherId) {
            return NextResponse.json({ error: "تخصص یافت نشد" }, { status: 404 });
        }

        await (prisma as any).teacherSpecialization.delete({ where: { id: specId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در حذف تخصص" }, { status: 500 });
    }
}
