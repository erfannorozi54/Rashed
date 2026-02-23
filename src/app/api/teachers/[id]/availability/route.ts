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
        if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

        const { id: teacherId } = await params;

        const slots = await prisma.teacherAvailability.findMany({
            where: { teacherId },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        });

        const exceptions = await prisma.availabilityException.findMany({
            where: { teacherId },
            orderBy: { date: "asc" },
        });

        return NextResponse.json({ slots, exceptions });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

        const { id: teacherId } = await params;

        if (session.user.role !== "ADMIN" && session.user.id !== teacherId) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const { slots } = await request.json();

        await prisma.$transaction([
            prisma.teacherAvailability.deleteMany({ where: { teacherId } }),
            ...slots.map((s: { dayOfWeek: number; startTime: string; endTime: string }) =>
                prisma.teacherAvailability.create({
                    data: { teacherId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime },
                })
            ),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}