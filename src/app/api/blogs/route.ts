import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TEACHER") {
            return NextResponse.json(
                { error: "دسترسی غیرمجاز" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: "عنوان و محتوا الزامی هستند" },
                { status: 400 }
            );
        }

        const blog = await prisma.blog.create({
            data: {
                title,
                content,
                authorId: session.user.id,
            },
            include: {
                author: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                message: "بلاگ با موفقیت ایجاد شد",
                blog,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Blog creation error:", error);
        return NextResponse.json(
            { error: "خطا در ایجاد بلاگ" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (id) {
            // Get single blog
            const blog = await prisma.blog.findUnique({
                where: { id },
                include: {
                    author: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            if (!blog) {
                return NextResponse.json(
                    { error: "بلاگ یافت نشد" },
                    { status: 404 }
                );
            }

            return NextResponse.json({ blog });
        }

        // Get all blogs
        const blogs = await prisma.blog.findMany({
            include: {
                author: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ blogs });
    } catch (error) {
        console.error("Blog fetch error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت بلاگ‌ها" },
            { status: 500 }
        );
    }
}
