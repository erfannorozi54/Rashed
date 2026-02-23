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

// GET fetch sessions for current user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // upcoming, past, or all

        let whereClause: any = {};

        // If student, only show sessions for enrolled classes
        if (session.user.role === "STUDENT") {
            const enrollments = await prisma.classEnrollment.findMany({
                where: {
                    studentId: session.user.id,
                },
                select: {
                    classId: true,
                },
            });

            const classIds = enrollments.map((e) => e.classId);
            whereClause.classId = { in: classIds };
        } else if (session.user.role === "TEACHER") {
            // If teacher, show sessions for taught classes
            const teaching = await prisma.classTeacher.findMany({
                where: {
                    teacherId: session.user.id,
                },
                select: {
                    classId: true,
                },
            });

            const classIds = teaching.map((t) => t.classId);
            whereClause.classId = { in: classIds };
        }

        // Filter by date based on type or range
        const now = new Date();
        whereClause.cancelled = false;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        } else if (type === "upcoming") {
            whereClause.date = { gte: now };
        } else if (type === "past") {
            whereClause.date = { lt: now };
        }

        const sessions = await prisma.session.findMany({
            where: whereClause,
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                date: "asc",
            },
            // Remove take limit if fetching by range (calendar view)
            take: (startDate && endDate) ? undefined : 20,
        });

        return NextResponse.json({ sessions }, { status: 200 });
    } catch (error) {
        console.error("Get sessions error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت جلسات" },
            { status: 500 }
        );
    }
}
