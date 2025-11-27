import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST create new session
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (
            !session ||
            (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")
        ) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const body = await request.json();
        const { classId, title, description, date, contents } = body;

        if (!classId || !title || !date) {
            return NextResponse.json(
                { error: "اطلاعات جلسه ناقص است" },
                { status: 400 }
            );
        }

        // Check if user is a teacher of this class
        const classTeacher = await prisma.classTeacher.findFirst({
            where: {
                classId,
                teacherId: session.user.id,
            },
        });

        if (!classTeacher && session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "شما معلم این کلاس نیستید" },
                { status: 403 }
            );
        }

        // Create session with contents
        const newSession = await prisma.session.create({
            data: {
                classId,
                title,
                description,
                date: new Date(date),
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
                contents: true,
            },
        });

        return NextResponse.json(
            {
                message: "جلسه با موفقیت ایجاد شد",
                session: newSession,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create session error:", error);
        return NextResponse.json(
            { error: "خطا در ایجاد جلسه" },
            { status: 500 }
        );
    }
}
