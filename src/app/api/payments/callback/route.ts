import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — called by aqayepardakht gateway after payment
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id");
    const transid = searchParams.get("transid");
    const status = searchParams.get("status"); // "1" = success, "0" = fail

    if (!paymentId || !transid) {
        return NextResponse.redirect(new URL("/payment/callback?status=failed", request.url));
    }

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { enrollment: true },
    });

    if (!payment) {
        return NextResponse.redirect(new URL("/payment/callback?status=failed", request.url));
    }

    // Skip verify if gateway already says failed
    if (status !== "1") {
        await prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });
        return NextResponse.redirect(
            new URL(`/payment/callback?status=failed&payment_id=${paymentId}`, request.url)
        );
    }

    // Verify with gateway
    const verifyRes = await fetch("https://panel.aqayepardakht.ir/api/v2/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            pin: process.env.AQAYEPARDAKHT_PIN,
            amount: payment.amount,
            transid,
        }),
    });

    const verifyData = await verifyRes.json();

    if (verifyData.status === "success" && (verifyData.code === "1" || verifyData.code === 1)) {
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
        return NextResponse.redirect(
            new URL(`/payment/callback?status=success&payment_id=${paymentId}`, request.url)
        );
    }

    await prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });
    return NextResponse.redirect(
        new URL(`/payment/callback?status=failed&payment_id=${paymentId}`, request.url)
    );
}
