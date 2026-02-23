import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { computeStudentDebt } from "@/lib/debt-utils";
import { getTeacherFreeSlots } from "@/lib/availability-utils";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "فقط دانشآموزان" }, { status: 403 });
        }

        const { sessionId } = await params;
        const { newDate } = await request.json();
        if (!newDate) return NextResponse.json({ error: "تاریخ جدید الزامی است" }, { status: 400 });

        const targetSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                class: {
                    include: {
                        students: { where: { status: "ENROLLED" } },
                        teachers: { select: { teacherId: true } },
                    },
                },
            },
        });

        if (!targetSession || targetSession.cancelled) {
            return NextResponse.json({ error: "جلسه یافت نشد" }, { status: 404 });
        }

        // Must be enrolled
        const isEnrolled = targetSession.class.students.some((s) => s.studentId === session.user.id);
        if (!isEnrolled) return NextResponse.json({ error: "در این کلاس ثبتنام نیستید" }, { status: 403 });

        // Only 1-participant classes
        if (targetSession.class.students.length !== 1) {
            return NextResponse.json({ error: "تغییر زمان فقط برای کلاسهای تکنفره" }, { status: 400 });
        }

        // Must be 24h+ away
        const hoursUntil = (new Date(targetSession.date).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < 24) {
            return NextResponse.json({ error: "تغییر زمان فقط تا ۲۴ ساعت قبل از جلسه" }, { status: 400 });
        }

        // Validate new date is in teacher's free slot
        const teacherId = targetSession.class.teachers[0]?.teacherId;
        if (!teacherId) return NextResponse.json({ error: "معلمی یافت نشد" }, { status: 400 });

        const newDateObj = new Date(newDate);
        const freeSlots = await getTeacherFreeSlots(teacherId, newDateObj, targetSession.class.sessionDuration);
        const newTime = `${String(newDateObj.getHours()).padStart(2, "0")}:${String(newDateObj.getMinutes()).padStart(2, "0")}`;
        const newEndMinutes = newDateObj.getHours() * 60 + newDateObj.getMinutes() + targetSession.class.sessionDuration;

        const fits = freeSlots.some((slot) => {
            const [sh, sm] = slot.start.split(":").map(Number);
            const [eh, em] = slot.end.split(":").map(Number);
            return newDateObj.getHours() * 60 + newDateObj.getMinutes() >= sh * 60 + sm && newEndMinutes <= eh * 60 + em;
        });
        if (!fits) return NextResponse.json({ error: "زمان انتخابی در بازه آزاد معلم نیست" }, { status: 400 });

        // Compute fee (20% of sessionPrice)
        const fee = Math.round(targetSession.class.sessionPrice * 0.2);

        // Check debt limit
        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { maxDebtLimit: true } });
        const { debt } = await computeStudentDebt(session.user.id);
        const requiresPayment = debt + fee > (user?.maxDebtLimit ?? 4000000);

        if (requiresPayment) {
            // Create payment record for the fee — student must pay before reschedule
            // For now, return requiresPayment flag; frontend handles mock payment
            return NextResponse.json({ requiresPayment: true, fee }, { status: 200 });
        }

        // Cancel original, create new compensatory session
        const [, newSession] = await prisma.$transaction([
            prisma.session.update({ where: { id: sessionId }, data: { cancelled: true } }),
            prisma.session.create({
                data: {
                    classId: targetSession.classId,
                    title: `${targetSession.title} (جابجایی)`,
                    description: targetSession.description,
                    date: newDateObj,
                    type: "COMPENSATORY",
                    createdBy: session.user.id,
                },
            }),
        ]);

        await prisma.sessionReschedule.create({
            data: {
                studentId: session.user.id,
                originalSessionId: sessionId,
                newSessionId: newSession.id,
                fee,
                feeHandling: "DEBT",
            },
        });

        return NextResponse.json({ success: true, newSession, fee });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}
