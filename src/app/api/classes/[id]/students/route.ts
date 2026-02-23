import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { computePaymentAmount } from "@/lib/enrollment-utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { id: classId } = await params;

        // Access: ADMIN or class teacher
        if (session.user.role !== "ADMIN") {
            const isTeacher = await prisma.classTeacher.findUnique({
                where: {
                    classId_teacherId: { classId, teacherId: session.user.id },
                },
            });
            if (!isTeacher) {
                return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
            }
        }

        const enrollments = await prisma.classEnrollment.findMany({
            where: { classId },
            include: {
                student: { select: { id: true, name: true, phone: true } },
                payment: true,
            },
        });

        const students = enrollments.map((e) => ({
            id: e.student.id,
            name: e.student.name,
            phone: e.student.phone,
            enrollmentId: e.id,
            enrollmentStatus: e.status,
            paidAmount: e.paidAmount,
            payment: e.payment
                ? {
                      id: e.payment.id,
                      amount: e.payment.amount,
                      status: e.payment.status,
                  }
                : null,
        }));

        return NextResponse.json({ students }, { status: 200 });
    } catch (error) {
        console.error("Get students error:", error);
        return NextResponse.json({ error: "خطا در دریافت دانش‌آموزان" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });
        }

        const { id: classId } = await params;

        // Access: ADMIN or class teacher
        if (session.user.role !== "ADMIN") {
            const isTeacher = await prisma.classTeacher.findUnique({
                where: {
                    classId_teacherId: { classId, teacherId: session.user.id },
                },
            });
            if (!isTeacher) {
                return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
            }
        }

        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json({ error: "شناسه دانش‌آموز الزامی است" }, { status: 400 });
        }

        // Check not already enrolled
        const existing = await prisma.classEnrollment.findUnique({
            where: { classId_studentId: { classId, studentId } },
        });
        if (existing) {
            return NextResponse.json({ error: "دانش‌آموز قبلاً ثبت‌نام شده است" }, { status: 409 });
        }

        // Check capacity
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
            const enrollment = await prisma.classEnrollment.create({
                data: { classId, studentId, status: "ENROLLED" },
            });
            return NextResponse.json({ enrollment, enrolled: true }, { status: 201 });
        } else {
            const enrollment = await prisma.classEnrollment.create({
                data: { classId, studentId, status: "PENDING_PAYMENT" },
            });
            const payment = await prisma.payment.create({
                data: {
                    studentId,
                    classId,
                    enrollmentId: enrollment.id,
                    amount: paymentAmount,
                    status: "PENDING",
                },
            });
            return NextResponse.json({ enrollment, payment }, { status: 201 });
        }
    } catch (error) {
        console.error("Add student error:", error);
        return NextResponse.json({ error: "خطا در افزودن دانش‌آموز" }, { status: 500 });
    }
}
