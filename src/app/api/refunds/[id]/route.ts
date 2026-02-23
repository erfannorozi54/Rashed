import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "فقط مدیر" }, { status: 403 });
        }

        const { id } = await params;
        const { status, adminNote } = await request.json();

        if (!status || !["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "وضعیت نامعتبر" }, { status: 400 });
        }

        const refund = await prisma.refundRequest.findUnique({
            where: { id },
            include: { payment: true },
        });
        if (!refund) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
        if (refund.status !== "PENDING") {
            return NextResponse.json({ error: "قبلاً بررسی شده" }, { status: 400 });
        }

        if (status === "APPROVED") {
            await prisma.$transaction([
                prisma.refundRequest.update({ where: { id }, data: { status, adminNote } }),
                prisma.classEnrollment.update({
                    where: { id: refund.payment.enrollmentId },
                    data: { paidAmount: { decrement: refund.amount } },
                }),
            ]);
        } else {
            await prisma.refundRequest.update({ where: { id }, data: { status, adminNote } });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}