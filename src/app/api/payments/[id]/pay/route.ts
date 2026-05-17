import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

    const { id } = await params;
    const payment = await prisma.payment.findUnique({ where: { id } });

    if (!payment) return NextResponse.json({ error: "پرداخت یافت نشد" }, { status: 404 });
    if (payment.studentId !== session.user.id) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    if (payment.status !== "PENDING") return NextResponse.json({ error: "این پرداخت قابل پردازش نیست" }, { status: 400 });

    const baseUrl = process.env.NEXTAUTH_URL!;
    const callbackUrl = `${baseUrl}/api/payments/callback?payment_id=${payment.id}`;

    const gwRes = await fetch("https://panel.aqayepardakht.ir/api/v2/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            pin: process.env.AQAYEPARDAKHT_PIN,
            amount: payment.amount,
            callback: callbackUrl,
            callback_method: "GET",
            invoice_id: payment.id,
        }),
    });

    const gwData = await gwRes.json();
    if (gwData.status !== "success") {
        return NextResponse.json({ error: `خطای درگاه: ${gwData.code}` }, { status: 502 });
    }

    return NextResponse.json({ redirectUrl: `https://panel.aqayepardakht.ir/startpay/${gwData.transid}` });
}
