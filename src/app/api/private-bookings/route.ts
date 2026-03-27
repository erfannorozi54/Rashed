import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getTeacherFreeSlots } from "@/lib/availability-utils";
import { createTehranDateTime } from "@/lib/jalali-utils";

function timeToMin(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}


export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

        const where =
            session.user.role === "STUDENT"
                ? { studentId: session.user.id }
                : session.user.role === "TEACHER"
                ? { teacherId: session.user.id }
                : {};

        const bookings = await (prisma as any).privateBooking.findMany({
            where,
            include: {
                student: { select: { id: true, name: true } },
                teacher: { select: { id: true, name: true } },
                specialization: true,
            },
            orderBy: [{ date: "desc" }, { startTime: "asc" }],
        });

        return NextResponse.json({ bookings });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در دریافت رزروها" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "فقط دانش‌آموزان می‌توانند رزرو کنند" }, { status: 403 });
        }

        const body = await request.json();
        const { teacherId, specializationId, date, startTime } = body;

        if (!teacherId || !date || !startTime) {
            return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
        }

        // Validate teacher exists
        const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
        if (!teacher || (teacher.role !== "TEACHER" && teacher.role !== "ADMIN")) {
            return NextResponse.json({ error: "استاد یافت نشد" }, { status: 404 });
        }

        // Validate specialization and get price
        let amount = 0;
        let specContent: string | null = null;
        if (specializationId) {
            const spec = await (prisma as any).teacherSpecialization.findUnique({
                where: { id: specializationId },
            });
            if (!spec || spec.teacherId !== teacherId) {
                return NextResponse.json({ error: "تخصص نامعتبر است" }, { status: 400 });
            }
            amount = spec.price;
            specContent = spec.content;
        }

        // Validate slot is free
        const dateObj = new Date(date);
        const freeSlots = await getTeacherFreeSlots(teacherId, dateObj, 90);
        const startMin = timeToMin(startTime);
        const endMin = startMin + 90;

        const slotIsFree = freeSlots.some(
            (s) => timeToMin(s.start) <= startMin && timeToMin(s.end) >= endMin
        );
        if (!slotIsFree) {
            return NextResponse.json({ error: "این زمان در دسترس نیست" }, { status: 409 });
        }

        // Build session datetime in Tehran timezone
        const sessionDateTime = createTehranDateTime(date, startTime);

        // Create Class (PRIVATE) + Session + Enrollment + Payment in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const cls = await tx.class.create({
                data: {
                    name: `جلسه خصوصی با ${teacher.name}`,
                    description: specContent,
                    classType: "PRIVATE",
                    sessionDuration: 90,
                    sessionPrice: amount,
                    teachers: { create: [{ teacherId }] },
                    sessions: {
                        create: [{
                            title: specContent ?? "جلسه خصوصی",
                            date: sessionDateTime,
                            type: "SCHEDULED",
                        }],
                    },
                },
                include: { sessions: true },
            });

            const enrollment = await tx.classEnrollment.create({
                data: {
                    classId: cls.id,
                    studentId: session.user.id,
                    status: amount > 0 ? "PENDING_PAYMENT" : "ENROLLED",
                },
            });

            if (amount > 0) {
                const payment = await tx.payment.create({
                    data: {
                        studentId: session.user.id,
                        classId: cls.id,
                        enrollmentId: enrollment.id,
                        amount,
                        status: "PENDING",
                    },
                });
                return { payment };
            }

            return { payment: null };
        });

        const redirectUrl = result.payment
            ? `/payment/mock?payment_id=${result.payment.id}`
            : `/dashboard/student/classes`;

        return NextResponse.json({ redirectUrl }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در ثبت رزرو" }, { status: 500 });
    }
}
