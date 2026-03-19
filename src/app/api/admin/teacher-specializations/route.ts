import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const specializations = await (prisma as any).teacherSpecialization.findMany({
            include: {
                teacher: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ specializations });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در دریافت تخصص‌ها" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const body = await request.json();
        const { teacherId, subject, grade, content, price } = body;

        if (!teacherId || !subject || !grade || !content) {
            return NextResponse.json({ error: "فیلدهای الزامی وارد نشده‌اند" }, { status: 400 });
        }

        const teacher = await prisma.user.findUnique({
            where: { id: teacherId },
        });
        if (!teacher || (teacher.role !== "TEACHER" && teacher.role !== "ADMIN")) {
            return NextResponse.json({ error: "استاد یافت نشد" }, { status: 404 });
        }

        const specialization = await (prisma as any).teacherSpecialization.create({
            data: {
                teacherId,
                subject,
                grade,
                content,
                price: Number(price) || 0,
            },
            include: {
                teacher: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ specialization }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در ایجاد تخصص" }, { status: 500 });
    }
}
