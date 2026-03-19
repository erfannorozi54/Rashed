import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

        const { id } = await params;

        const booking = await (prisma as any).privateBooking.findUnique({
            where: { id },
            include: {
                student: { select: { id: true, name: true } },
                teacher: { select: { id: true, name: true } },
                specialization: true,
            },
        });

        if (!booking) {
            return NextResponse.json({ error: "رزرو یافت نشد" }, { status: 404 });
        }

        if (
            session.user.role !== "ADMIN" &&
            booking.studentId !== session.user.id &&
            booking.teacherId !== session.user.id
        ) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        return NextResponse.json({ booking });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}
