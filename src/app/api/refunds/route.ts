import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

        const where = session.user.role === "ADMIN" ? {} : { studentId: session.user.id };

        const refunds = await prisma.refundRequest.findMany({
            where,
            include: {
                student: { select: { id: true, name: true, phone: true } },
                payment: { include: { class: { select: { name: true } } } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ refunds });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "فقط دانشآموزان" }, { status: 403 });
        }

        const { paymentId, amount, reason } = await request.json();
        if (!paymentId || !amount || !reason) {
            return NextResponse.json({ error: "تمام فیلدها الزامی است" }, { status: 400 });
        }

        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment || payment.studentId !== session.user.id) {
            return NextResponse.json({ error: "پرداخت یافت نشد" }, { status: 404 });
        }
        if (payment.status !== "SUCCESS") {
            return NextResponse.json({ error: "فقط پرداختهای موفق قابل استرداد هستند" }, { status: 400 });
        }
        if (amount > payment.amount) {
            return NextResponse.json({ error: "مبلغ بیشتر از پرداخت است" }, { status: 400 });
        }

        const refund = await prisma.refundRequest.create({
            data: { studentId: session.user.id, paymentId, amount, reason },
        });

        return NextResponse.json({ refund }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}