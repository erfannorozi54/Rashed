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

        const { id } = await params;

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                class: { select: { id: true, name: true } },
                enrollment: { select: { status: true } },
            },
        });

        if (!payment) {
            return NextResponse.json({ error: "پرداخت یافت نشد" }, { status: 404 });
        }

        // Access: payment owner or ADMIN
        if (payment.studentId !== session.user.id && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        return NextResponse.json({ payment }, { status: 200 });
    } catch (error) {
        console.error("Get payment error:", error);
        return NextResponse.json({ error: "خطا در دریافت اطلاعات پرداخت" }, { status: 500 });
    }
}
