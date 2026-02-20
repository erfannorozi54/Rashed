import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
                        select: {
                            studentId: true,
                        },
                    },
                    sessions: {
                        orderBy: {
                            date: "desc",
                        },
                        take: 1, // Get latest session
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
        const formattedClasses = classes.map((cls) => ({
            id: cls.id,
            name: cls.name,
            description: cls.description,
            teachers: cls.teachers.map((t) => t.teacher),
            studentCount: cls.students.length,
            latestSession: cls.sessions[0] || null,
            createdAt: cls.createdAt,
        }));

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
        const { name, description, scheduledSessions } = body;

        if (!name) {
            return NextResponse.json(
                { error: "نام کلاس الزامی است" },
                { status: 400 }
            );
        }

        // Create class with the creator as a teacher and optional scheduled sessions
        const newClass = await prisma.class.create({
            data: {
                name,
                description,
                teachers: {
                    create: {
                        teacherId: session.user.id,
                    },
                },
                sessions: scheduledSessions && scheduledSessions.length > 0 ? {
                    create: scheduledSessions.map((s: any) => ({
                        title: s.title,
                        description: s.description,
                        date: new Date(s.date),
                        type: "SCHEDULED"
                    }))
                } : undefined
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
            { error: "خطا در ایجاد کلاس" },
            { status: 500 }
        );
    }
}
