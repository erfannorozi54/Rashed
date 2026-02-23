import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; studentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { id: classId, studentId } = await params;

        // Access: ADMIN or class teacher
        if (session.user.role !== "ADMIN") {
            const isTeacher = await prisma.classTeacher.findUnique({
                where: {
                    classId_teacherId: { classId, teacherId: session.user.id },
                },
            });
            if (!isTeacher) {
                return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
            }
        }

        const enrollment = await prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId } },
        });

        if (!enrollment) {
            return NextResponse.json({ error: "ثبت‌نام یافت نشد" }, { status: 404 });
        }

        // Delete payment first if exists (cascade should handle it but being explicit)
        await prisma.payment.deleteMany({ where: { enrollmentId: enrollment.id } });
        await prisma.classEnrollment.delete({ where: { id: enrollment.id } });

        return NextResponse.json({ message: "دانش‌آموز با موفقیت حذف شد" }, { status: 200 });
    } catch (error) {
        console.error("Delete student error:", error);
        return NextResponse.json({ error: "خطا در حذف دانش‌آموز" }, { status: 500 });
    }
}
