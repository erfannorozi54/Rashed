import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

        const body = await request.json();
        const { bookingId, status } = body;

        if (!bookingId || !["success", "failed"].includes(status)) {
            return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });
        }

        const booking = await (prisma as any).privateBooking.findUnique({ where: { id: bookingId } });

        if (!booking) {
            return NextResponse.json({ error: "رزرو یافت نشد" }, { status: 404 });
        }

        if (booking.studentId !== session.user.id) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        if (status === "success") {
            await (prisma as any).privateBooking.update({
                where: { id: bookingId },
                data: { status: "CONFIRMED", paidAt: new Date() },
            });
            return NextResponse.json({ success: true, bookingStatus: "CONFIRMED" });
        } else {
            return NextResponse.json({ success: false, bookingStatus: "PENDING_PAYMENT" });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در پردازش پرداخت" }, { status: 500 });
    }
}
