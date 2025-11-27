import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// GET all users (admin and teachers only)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        // Only admin and teachers can view users
        if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error("Get users error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت کاربران" },
            { status: 500 }
        );
    }
}

// PATCH update user role (admin only)
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const body = await request.json();
        const { userId, newRole } = body;

        if (!userId || !newRole) {
            return NextResponse.json(
                { error: "شناسه کاربر و نقش جدید الزامی است" },
                { status: 400 }
            );
        }

        // Validate role
        if (!Object.values(Role).includes(newRole)) {
            return NextResponse.json({ error: "نقش نامعتبر است" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                phone: true,
                role: true,
            },
        });

        return NextResponse.json(
            {
                message: "نقش کاربر با موفقیت تغییر کرد",
                user: updatedUser,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update user role error:", error);
        return NextResponse.json(
            { error: "خطا در تغییر نقش کاربر" },
            { status: 500 }
        );
    }
}
