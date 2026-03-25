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

        const specializations = await (prisma as any).teacherSpecialization.findMany({
            where: { teacherId },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ specializations });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { id: teacherId } = await params;

        // Only the teacher themselves or an admin can add specs
        if (session.user.role !== "ADMIN" && session.user.id !== teacherId) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const body = await request.json();
        const { subject, grade, content, price } = body;

        if (!subject || !grade || !content || price === undefined || price === "" || Number(price) <= 0) {
            return NextResponse.json({ error: "تمام فیلدها الزامی هستند و قیمت باید بیشتر از صفر باشد" }, { status: 400 });
        }

        const specialization = await (prisma as any).teacherSpecialization.create({
            data: {
                teacherId,
                subject: subject.trim(),
                grade: grade.trim(),
                content: content.trim(),
                price: Number(price),
            },
        });

        return NextResponse.json({ specialization }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در ایجاد تخصص" }, { status: 500 });
    }
}
