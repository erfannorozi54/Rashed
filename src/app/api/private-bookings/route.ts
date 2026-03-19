import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getTeacherFreeSlots } from "@/lib/availability-utils";

function timeToMin(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function minToTime(m: number): string {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
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

        // Validate specialization belongs to teacher (if provided)
        let amount = 0;
        if (specializationId) {
            const spec = await (prisma as any).teacherSpecialization.findUnique({
                where: { id: specializationId },
            });
            if (!spec || spec.teacherId !== teacherId) {
                return NextResponse.json({ error: "تخصص نامعتبر است" }, { status: 400 });
            }
            amount = spec.price;
        }

        // Validate slot is free
        const dateObj = new Date(date);
        const freeSlots = await getTeacherFreeSlots(teacherId, dateObj, 90);
        const startMin = timeToMin(startTime);
        const endMin = startMin + 90;
        const endTime = minToTime(endMin);

        const slotIsFree = freeSlots.some(
            (s) => timeToMin(s.start) <= startMin && timeToMin(s.end) >= endMin
        );
        if (!slotIsFree) {
            return NextResponse.json({ error: "این زمان در دسترس نیست" }, { status: 409 });
        }

        const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

        const booking = await (prisma as any).privateBooking.create({
            data: {
                studentId: session.user.id,
                teacherId,
                specializationId: specializationId || null,
                date: dateOnly,
                startTime,
                endTime,
                amount,
                status: "PENDING_PAYMENT",
            },
        });

        return NextResponse.json(
            {
                bookingId: booking.id,
                redirectUrl: `/payment/mock?booking_id=${booking.id}&type=private`,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا در ثبت رزرو" }, { status: 500 });
    }
}
