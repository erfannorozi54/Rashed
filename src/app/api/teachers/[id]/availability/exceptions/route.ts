import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
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

        const { date, startTime, endTime } = await request.json();
        if (!date) return NextResponse.json({ error: "تاریخ الزامی است" }, { status: 400 });

        const exception = await prisma.availabilityException.create({
            data: { teacherId, date: new Date(date), startTime: startTime || null, endTime: endTime || null },
        });

        return NextResponse.json({ exception }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}