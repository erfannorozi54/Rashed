import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const { id: userId } = await params;

        // Get user details with all enrollments and attendance
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                enrolledClasses: {
                    include: {
                        class: {
                            include: {
                                teachers: {
                                    include: {
                                        teacher: {
                                            select: {
                                                id: true,
                                                name: true,
                                            },
                                        },
                                    },
                                },
                                sessions: {
                                    include: {
                                        attendances: {
                                            where: {
                                                studentId: userId,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                taughtClasses: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                students: true,
                            },
                        },
                    },
                },
                attendanceRecords: {
                    include: {
                        session: {
                            include: {
                                class: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                blogs: {
                    select: {
                        id: true,
                        title: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "کاربر یافت نشد" },
                { status: 404 }
            );
        }

        // Calculate attendance statistics for each enrolled class
        const classStats = user.enrolledClasses.map((enrollment) => {
            const totalSessions = enrollment.class.sessions.length;
            const attendedSessions = enrollment.class.sessions.filter(
                (session) =>
                    session.attendances.length > 0 &&
                    session.attendances[0].status === "PRESENT"
            ).length;
            const absentSessions = enrollment.class.sessions.filter(
                (session) =>
                    session.attendances.length > 0 &&
                    session.attendances[0].status === "ABSENT"
            ).length;
            const unmarkedSessions = enrollment.class.sessions.filter(
                (session) => session.attendances.length === 0
            ).length;

            return {
                classId: enrollment.class.id,
                className: enrollment.class.name,
                classDescription: enrollment.class.description,
                teachers: enrollment.class.teachers.map((t) => t.teacher),
                enrolledAt: enrollment.enrolledAt,
                statistics: {
                    totalSessions,
                    presentCount: attendedSessions,
                    absentCount: absentSessions,
                    unmarkedCount: unmarkedSessions,
                    attendanceRate:
                        totalSessions > 0
                            ? Math.round((attendedSessions / totalSessions) * 100)
                            : 0,
                },
            };
        });

        // Teaching statistics for teachers
        const teachingStats = user.taughtClasses.map((teaching) => ({
            classId: teaching.class.id,
            className: teaching.class.name,
            classDescription: teaching.class.description,
            studentCount: teaching.class.students.length,
        }));

        // Overall attendance statistics
        const totalAttendanceRecords = user.attendanceRecords.length;
        const totalPresent = user.attendanceRecords.filter(
            (a) => a.status === "PRESENT"
        ).length;
        const totalAbsent = user.attendanceRecords.filter(
            (a) => a.status === "ABSENT"
        ).length;

        const response = {
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
            enrolledClasses: classStats,
            teachingClasses: teachingStats,
            overallStatistics: {
                totalEnrolledClasses: user.enrolledClasses.length,
                totalTeachingClasses: user.taughtClasses.length,
                totalAttendanceRecords,
                totalPresent,
                totalAbsent,
                overallAttendanceRate:
                    totalAttendanceRecords > 0
                        ? Math.round((totalPresent / totalAttendanceRecords) * 100)
                        : 0,
                totalBlogs: user.blogs.length,
            },
            recentActivity: {
                recentBlogs: user.blogs.slice(0, 5),
                recentAttendance: user.attendanceRecords
                    .sort(
                        (a, b) =>
                            new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime()
                    )
                    .slice(0, 10)
                    .map((a) => ({
                        sessionId: a.sessionId,
                        className: a.session.class.name,
                        status: a.status,
                        markedAt: a.markedAt,
                    })),
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Get user details error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت اطلاعات کاربر" },
            { status: 500 }
        );
    }
}
