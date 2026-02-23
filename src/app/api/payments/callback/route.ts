import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const body = await request.json();
        const { paymentId, status } = body;

        if (!paymentId || !["success", "failed"].includes(status)) {
            return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });
        }

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { enrollment: true },
        });

        if (!payment) {
            return NextResponse.json({ error: "پرداخت یافت نشد" }, { status: 404 });
        }

        // Must own the payment
        if (payment.studentId !== session.user.id) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        if (status === "success") {
            await prisma.$transaction([
                prisma.payment.update({
                    where: { id: paymentId },
                    data: { status: "SUCCESS", paidAt: new Date() },
                }),
                prisma.classEnrollment.update({
                    where: { id: payment.enrollmentId },
                    data: { status: "ENROLLED", paidAmount: payment.amount },
                }),
            ]);

            return NextResponse.json(
                { success: true, enrollmentStatus: "ENROLLED" },
                { status: 200 }
            );
        } else {
            await prisma.payment.update({
                where: { id: paymentId },
                data: { status: "FAILED" },
            });

            return NextResponse.json(
                { success: false, enrollmentStatus: "PENDING_PAYMENT" },
                { status: 200 }
            );
        }
    } catch (error) {
        console.error("Payment callback error:", error);
        return NextResponse.json({ error: "خطا در پردازش پرداخت" }, { status: 500 });
    }
}
