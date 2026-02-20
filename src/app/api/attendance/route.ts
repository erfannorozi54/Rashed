import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST/PATCH mark or update attendance
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
        const { sessionId, attendanceData } = body;
        // attendanceData: [{ studentId, status }]

        if (!sessionId || !attendanceData || !Array.isArray(attendanceData)) {
            return NextResponse.json(
                { error: "اطلاعات حضور و غیاب ناقص است" },
                { status: 400 }
            );
        }

        // Verify teacher has access to this session's class
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
            return NextResponse.json(
                { error: "جلسه یافت نشد" },
                { status: 404 }
            );
        }

        if (
            sessionData.class.teachers.length === 0 &&
            session.user.role !== "ADMIN"
        ) {
            return NextResponse.json(
                { error: "شما معلم این کلاس نیستید" },
                { status: 403 }
            );
        }

        // Update or create attendance records
        const operations = attendanceData.map((record: any) => {
            if (record.status === null || record.status === undefined) {
                // Delete attendance record (set to null)
                return prisma.attendance.deleteMany({
                    where: {
                        sessionId,
                        studentId: record.studentId,
                    },
                });
            } else {
                // Upsert attendance record
                return prisma.attendance.upsert({
                    where: {
                        sessionId_studentId: {
                            sessionId,
                            studentId: record.studentId,
                        },
                    },
                    update: {
                        status: record.status,
                    },
                    create: {
                        sessionId,
                        studentId: record.studentId,
                        status: record.status,
                    },
                });
            }
        });

        await Promise.all(operations);

        return NextResponse.json(
            { message: "حضور و غیاب با موفقیت ثبت شد" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Mark attendance error:", error);
        return NextResponse.json(
            { error: "خطا در ثبت حضور و غیاب" },
            { status: 500 }
        );
    }
}

// GET attendance for a session
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json(
                { error: "شناسه جلسه الزامی است" },
                { status: 400 }
            );
        }

        const attendanceRecords = await prisma.attendance.findMany({
            where: { sessionId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        });

        return NextResponse.json({ attendance: attendanceRecords }, { status: 200 });
    } catch (error) {
        console.error("Get attendance error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت حضور و غیاب" },
            { status: 500 }
        );
    }
}
