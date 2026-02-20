import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST create compensatory session
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const body = await request.json();
        const { classId, title, description, date, contents } = body;

        if (!classId || !title || !date) {
            return NextResponse.json(
                { error: "کلاس، عنوان و تاریخ جلسه الزامی است" },
                { status: 400 }
            );
        }

        // Verify teacher has access to this class
        const classTeacher = await prisma.classTeacher.findFirst({
            where: {
                classId,
                teacherId: session.user.id,
            },
        });

        if (!classTeacher) {
            return NextResponse.json(
                { error: "شما دسترسی به این کلاس را ندارید" },
                { status: 403 }
            );
        }

        // Create compensatory session
        const compensatorySession = await prisma.session.create({
            data: {
                classId,
                title,
                description,
                date: new Date(date),
                type: "COMPENSATORY",
                createdBy: session.user.id,
                contents: contents
                    ? {
                        create: contents.map((content: any) => ({
                            title: content.title,
                            description: content.description,
                            fileUrl: content.fileUrl,
                            fileType: content.fileType,
                        })),
                    }
                    : undefined,
            },
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                contents: true,
            },
        });

        return NextResponse.json(
            {
                message: "جلسه جبرانی با موفقیت ایجاد شد",
                session: compensatorySession,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create compensatory session error:", error);
        return NextResponse.json(
            { error: "خطا در ایجاد جلسه جبرانی" },
            { status: 500 }
        );
    }
}
