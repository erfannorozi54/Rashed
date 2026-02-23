import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { computePaymentAmount } from "@/lib/enrollment-utils";

// GET all classes (for students: enrolled classes, for teachers/admin: all classes)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const userId = session.user.id;
        const userRole = session.user.role;

        let classes;

        if (userRole === "STUDENT") {
            // Get only enrolled classes for students
            classes = await prisma.class.findMany({
                where: {
                    students: {
                        some: {
                            studentId: userId,
                        },
                    },
                },
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
                    students: {
                        where: { studentId: userId },
                        include: {
                            payment: true,
                        },
                    },
                    sessions: {
                        orderBy: {
                            date: "desc",
                        },
                        take: 1,
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        } else {
            // Teachers and admins can see all classes
            classes = await prisma.class.findMany({
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
                    students: {
                        select: {
                            studentId: true,
                        },
                    },
                    sessions: {
                        orderBy: {
                            date: "desc",
                        },
                        take: 1,
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        }

        // Format response
        const formattedClasses = classes.map((cls) => {
            const base = {
                id: cls.id,
                name: cls.name,
                description: cls.description,
                classType: cls.classType,
                maxCapacity: cls.maxCapacity,
                sessionDuration: cls.sessionDuration,
                sessionPrice: cls.sessionPrice,
                minSessionsToPay: cls.minSessionsToPay,
                teachers: cls.teachers.map((t) => t.teacher),
                studentCount: cls.students.length,
                latestSession: cls.sessions[0] || null,
                createdAt: cls.createdAt,
            };

            if (userRole === "STUDENT" && (cls.students as any[]).length > 0) {
                const enrollment = (cls.students as any[])[0];
                return {
                    ...base,
                    enrollmentStatus: enrollment.status,
                    paidAmount: enrollment.paidAmount,
                    payment: enrollment.payment
                        ? {
                              id: enrollment.payment.id,
                              amount: enrollment.payment.amount,
                              status: enrollment.payment.status,
                          }
                        : null,
                };
            }

            return base;
        });

        return NextResponse.json({ classes: formattedClasses }, { status: 200 });
    } catch (error) {
        console.error("Get classes error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت کلاس‌ها" },
            { status: 500 }
        );
    }
}

// POST create new class (teachers and admins only)
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
        const {
            name,
            description,
            classType,
            maxCapacity,
            sessionDuration,
            scheduledSessions,
            teacherIds,
            sessionPrice,
            minSessionsToPay,
            initialStudentIds,
        } = body;

        if (!name) {
            return NextResponse.json(
                { error: "نام کلاس الزامی است" },
                { status: 400 }
            );
        }

        const priceVal = sessionPrice !== undefined ? Number(sessionPrice) : 0;
        const minPay = minSessionsToPay !== undefined && minSessionsToPay !== "" ? Number(minSessionsToPay) : null;

        // For ADMIN: assign specified teachers from teacherIds array.
        // For TEACHER: assign themselves.
        const teacherAssignments =
            session.user.role === "ADMIN"
                ? teacherIds && teacherIds.length > 0
                    ? teacherIds.map((id: string) => ({ teacherId: id }))
                    : []
                : [{ teacherId: session.user.id }];

        // Create class with appropriate teacher assignments and optional scheduled sessions
        const newClass = await prisma.class.create({
            data: {
                name,
                description,
                classType: classType || "PUBLIC",
                maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
                sessionDuration: sessionDuration ? Number(sessionDuration) : 90,
                sessionPrice: priceVal,
                minSessionsToPay: minPay,
                teachers: {
                    create: teacherAssignments,
                },
                sessions:
                    scheduledSessions && scheduledSessions.length > 0
                        ? {
                              create: scheduledSessions.map((s: any) => ({
                                  title: s.title,
                                  description: s.description,
                                  date: new Date(s.date),
                                  type: "SCHEDULED",
                              })),
                          }
                        : undefined,
            },
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
                sessions: true,
            },
        });

        // Handle initial students enrollment
        if (
            session.user.role === "ADMIN" &&
            initialStudentIds &&
            initialStudentIds.length > 0
        ) {
            const totalSessions = newClass.sessions.length;

            for (const studentId of initialStudentIds) {
                const paymentAmount = computePaymentAmount(
                    priceVal,
                    minPay,
                    totalSessions
                );

                if (paymentAmount === 0) {
                    await prisma.classEnrollment.create({
                        data: {
                            classId: newClass.id,
                            studentId,
                            status: "ENROLLED",
                        },
                    });
                } else {
                    const enrollment = await prisma.classEnrollment.create({
                        data: {
                            classId: newClass.id,
                            studentId,
                            status: "PENDING_PAYMENT",
                        },
                    });
                    await prisma.payment.create({
                        data: {
                            studentId,
                            classId: newClass.id,
                            enrollmentId: enrollment.id,
                            amount: paymentAmount,
                            status: "PENDING",
                        },
                    });
                }
            }
        }

        return NextResponse.json(
            {
                message: "کلاس با موفقیت ایجاد شد",
                class: newClass,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create class error:", error);
        return NextResponse.json(
            { error: "خطا در ایجاد کلاس", detail: String(error) },
            { status: 500 }
        );
    }
}
