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

        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { id: classId } = await params;

        // Get class details with all relations
        const classData = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                teachers: {
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                            },
                        },
                    },
                },
                students: {
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
                sessions: {
                    include: {
                        contents: true,
                        assignments: {
                            select: {
                                id: true,
                                title: true,
                                dueDate: true,
                            },
                        },
                        attendances: session.user.role === "ADMIN"
                            ? true
                            : {
                                where: {
                                    studentId: session.user.id,
                                },
                            },
                    },
                    orderBy: {
                        date: "desc",
                    },
                },
            },
        });

        if (!classData) {
            return NextResponse.json(
                { error: "کلاس یافت نشد" },
                { status: 404 }
            );
        }

        // Check if user has access to this class
        const isTeacher = classData.teachers.some(
            (t) => t.teacherId === session.user.id
        );
        const isStudent = classData.students.some(
            (s) => s.studentId === session.user.id
        );
        const isAdmin = session.user.role === "ADMIN";

        if (!isTeacher && !isStudent && !isAdmin) {
            return NextResponse.json(
                { error: "دسترسی به این کلاس ندارید" },
                { status: 403 }
            );
        }

        // For admin: calculate attendance stats for each student
        let formattedStudents;
        if (isAdmin) {
            formattedStudents = classData.students.map((enrollment) => {
                const studentAttendances = classData.sessions.flatMap((session) =>
                    session.attendances.filter((att) => att.studentId === enrollment.student.id)
                );

                const totalSessions = classData.sessions.length;
                const presentCount = studentAttendances.filter((att) => att.status === "PRESENT").length;
                const absentCount = studentAttendances.filter((att) => att.status === "ABSENT").length;
                const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

                return {
                    ...enrollment.student,
                    statistics: {
                        totalSessions,
                        presentCount,
                        absentCount,
                        attendanceRate,
                    },
                };
            });
        } else {
            formattedStudents = classData.students.map((s) => ({
                ...s.student,
                enrolledAt: s.enrolledAt,
            }));
        }

        // Separate past and upcoming sessions
        const now = new Date();
        const pastSessions = classData.sessions.filter((s) => s.date < now);
        const upcomingSessions = classData.sessions.filter((s) => s.date >= now);

        // For admin: include attendance count in sessions
        const formattedSessions = isAdmin
            ? classData.sessions.map((session) => ({
                id: session.id,
                title: session.title,
                description: session.description,
                date: session.date,
                createdAt: session.createdAt,
                attendanceCount: {
                    total: classData.students.length,
                    present: session.attendances.filter((att) => att.status === "PRESENT").length,
                    absent: session.attendances.filter((att) => att.status === "ABSENT").length,
                },
                contents: session.contents,
                assignments: session.assignments,
            }))
            : [...pastSessions, ...upcomingSessions];

        const response = {
            id: classData.id,
            name: classData.name,
            description: classData.description,
            teachers: classData.teachers.map((t) => t.teacher),
            students: formattedStudents,
            sessions: formattedSessions,
            ...(!isAdmin && {
                pastSessions,
                upcomingSessions,
                totalSessions: classData.sessions.length,
            }),
            createdAt: classData.createdAt,
        };

        return NextResponse.json({ class: response }, { status: 200 });
    } catch (error) {
        console.error("Get class details error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت اطلاعات کلاس" },
            { status: 500 }
        );
    }
}
