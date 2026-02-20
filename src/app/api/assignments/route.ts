import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const userId = session.user.id;
        const userRole = session.user.role;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status"); // "pending" or "all"

        if (userRole === "STUDENT") {
            const whereClause: any = {
                session: {
                    class: {
                        students: {
                            some: {
                                studentId: userId,
                            },
                        },
                    },
                },
            };

            if (status === "pending") {
                whereClause.submissions = {
                    none: {
                        studentId: userId,
                    },
                };
            }

            const assignments = await prisma.assignment.findMany({
                where: whereClause,
                include: {
                    session: {
                        select: {
                            id: true,
                            title: true,
                            class: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    submissions: {
                        where: {
                            studentId: userId,
                        },
                        select: {
                            id: true,
                            submittedAt: true,
                            grade: true,
                        },
                    },
                },
                orderBy: {
                    dueDate: "asc",
                },
            });

            return NextResponse.json({ assignments }, { status: 200 });
        } else {
            // For teachers, maybe return assignments they created?
            // For now, let's just handle students as that's the requirement.
            return NextResponse.json({ assignments: [] }, { status: 200 });
        }
    } catch (error) {
        console.error("Get assignments error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت تکالیف" },
            { status: 500 }
        );
    }
}
