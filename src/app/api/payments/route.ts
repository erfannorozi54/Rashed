import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { computePaymentAmount } from "@/lib/enrollment-utils";

// GET student's own payments
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const payments = await prisma.payment.findMany({
            where: { studentId: session.user.id },
            include: {
                class: { select: { id: true, name: true } },
                enrollment: { select: { status: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ payments }, { status: 200 });
    } catch (error) {
        console.error("Get payments error:", error);
        return NextResponse.json({ error: "خطا در دریافت پرداخت‌ها" }, { status: 500 });
    }
}

// POST — student self-enrolls in a PUBLIC class
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "فقط دانش‌آموزان می‌توانند ثبت‌نام کنند" }, { status: 403 });
        }

        const body = await request.json();
        const { classId } = body;

        if (!classId) {
            return NextResponse.json({ error: "شناسه کلاس الزامی است" }, { status: 400 });
        }

        const classData = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                students: { select: { studentId: true } },
                sessions: { select: { id: true } },
            },
        });

        if (!classData) {
            return NextResponse.json({ error: "کلاس یافت نشد" }, { status: 404 });
        }

        if (classData.classType !== "PUBLIC") {
            return NextResponse.json(
                { error: "این کلاس برای ثبت‌نام آزاد نیست" },
                { status: 403 }
            );
        }

        // Check not already enrolled
        const existing = await prisma.classEnrollment.findUnique({
            where: {
                classId_studentId: { classId, studentId: session.user.id },
            },
        });
        if (existing) {
            return NextResponse.json(
                { error: "قبلاً در این کلاس ثبت‌نام شده‌اید" },
                { status: 409 }
            );
        }

        // Check capacity
        if (
            classData.maxCapacity &&
            classData.students.length >= classData.maxCapacity
        ) {
            return NextResponse.json({ error: "ظرفیت کلاس پر شده است" }, { status: 409 });
        }

        const totalSessions = classData.sessions.length;
        const paymentAmount = computePaymentAmount(
            classData.sessionPrice,
            classData.minSessionsToPay,
            totalSessions
        );

        if (paymentAmount === 0) {
            await prisma.classEnrollment.create({
                data: {
                    classId,
                    studentId: session.user.id,
                    status: "ENROLLED",
                },
            });
            return NextResponse.json({ enrolled: true }, { status: 200 });
        }

        const enrollment = await prisma.classEnrollment.create({
            data: {
                classId,
                studentId: session.user.id,
                status: "PENDING_PAYMENT",
            },
        });

        const payment = await prisma.payment.create({
            data: {
                studentId: session.user.id,
                classId,
                enrollmentId: enrollment.id,
                amount: paymentAmount,
                status: "PENDING",
            },
        });

        return NextResponse.json(
            {
                paymentId: payment.id,
                redirectUrl: `/payment/mock?payment_id=${payment.id}`,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create payment error:", error);
        return NextResponse.json({ error: "خطا در پردازش ثبت‌نام" }, { status: 500 });
    }
}
