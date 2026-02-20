import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET session details with contents and attendance
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { sessionId } = await params;

        const sessionData = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                contents: {
                    orderBy: {
                        uploadedAt: "desc",
                    },
                },
                attendances: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                            },
                        },
                    },
                },
                assignments: {
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!sessionData) {
            return NextResponse.json({ error: "جلسه یافت نشد" }, { status: 404 });
        }

        // Format response
        const formattedSession = {
            id: sessionData.id,
            title: sessionData.title,
            description: sessionData.description,
            date: sessionData.date,
            createdAt: sessionData.createdAt,
            class: sessionData.class,
            contents: sessionData.contents,
            attendances: sessionData.attendances.map((att) => ({
                id: att.id,
                status: att.status,
                markedAt: att.markedAt,
                student: att.student,
            })),
            assignments: sessionData.assignments,
            attendanceStats: {
                total: sessionData.attendances.length,
                present: sessionData.attendances.filter((att) => att.status === "PRESENT").length,
                absent: sessionData.attendances.filter((att) => att.status === "ABSENT").length,
                late: sessionData.attendances.filter((att) => att.status === "LATE").length,
                excused: sessionData.attendances.filter((att) => att.status === "EXCUSED").length,
            },
        };

        return NextResponse.json({ session: formattedSession }, { status: 200 });
    } catch (error) {
        console.error("Get session detail error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت اطلاعات جلسه" },
            { status: 500 }
        );
    }
}

// DELETE session
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const { sessionId } = await params;

        // Check if session exists and user has access
        const sessionData = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                class: {
                    include: {
                        teachers: {
                            where: {
                                teacherId: session.user.id,
                            },
                        },
                    },
                },
            },
        });

        if (!sessionData) {
            return NextResponse.json({ error: "جلسه یافت نشد" }, { status: 404 });
        }

        // If teacher, check if they teach this class
        if (session.user.role === "TEACHER" && sessionData.class.teachers.length === 0) {
            return NextResponse.json({ error: "شما دسترسی به این کلاس را ندارید" }, { status: 403 });
        }

        await prisma.session.delete({
            where: { id: sessionId },
        });

        return NextResponse.json({ message: "جلسه با موفقیت حذف شد" }, { status: 200 });
    } catch (error) {
        console.error("Delete session error:", error);
        return NextResponse.json(
            { error: "خطا در حذف جلسه" },
            { status: 500 }
        );
    }
}

// PATCH update session
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const { sessionId } = await params;
        const body = await request.json();
        const { title, description, date } = body;

        // Check if session exists and user has access
        const sessionData = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                class: {
                    include: {
                        teachers: {
                            where: {
                                teacherId: session.user.id,
                            },
                        },
                    },
                },
            },
        });

        if (!sessionData) {
            return NextResponse.json({ error: "جلسه یافت نشد" }, { status: 404 });
        }

        // If teacher, check if they teach this class
        if (session.user.role === "TEACHER" && sessionData.class.teachers.length === 0) {
            return NextResponse.json({ error: "شما دسترسی به این کلاس را ندارید" }, { status: 403 });
        }

        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: {
                title,
                description,
                date: date ? new Date(date) : undefined,
            },
        });

        return NextResponse.json({ session: updatedSession }, { status: 200 });
    } catch (error) {
        console.error("Update session error:", error);
        return NextResponse.json(
            { error: "خطا در ویرایش جلسه" },
            { status: 500 }
        );
    }
}
