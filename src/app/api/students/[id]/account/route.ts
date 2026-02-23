import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { computeStudentDebt } from "@/lib/debt-utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

        const { id: studentId } = await params;

        if (session.user.role !== "ADMIN" && session.user.id !== studentId) {
            return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: studentId },
            select: { maxDebtLimit: true },
        });
        if (!user) return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });

        const { debt, breakdown } = await computeStudentDebt(studentId);

        const payments = await prisma.payment.findMany({
            where: { studentId },
            include: { class: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });

        const refundRequests = await prisma.refundRequest.findMany({
            where: { studentId },
            include: { payment: { include: { class: { select: { name: true } } } } },
            orderBy: { createdAt: "desc" },
        });

        // Reschedulable sessions: 1-participant classes, 24h+ away, not cancelled
        const now = new Date();
        const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const enrollments2 = await prisma.classEnrollment.findMany({
            where: { studentId, status: "ENROLLED" },
            include: {
                class: {
                    include: {
                        students: { where: { status: "ENROLLED" }, select: { id: true } },
                        teachers: { select: { teacherId: true } },
                        sessions: {
                            where: { cancelled: false, date: { gt: cutoff } },
                            select: { id: true, title: true, date: true },
                            orderBy: { date: "asc" },
                        },
                    },
                },
            },
        });
        const reschedulableSessions = enrollments2
            .filter((e) => e.class.students.length === 1)
            .flatMap((e) =>
                e.class.sessions.map((s) => ({
                    id: s.id,
                    title: s.title,
                    date: s.date,
                    className: e.class.name,
                    teacherId: e.class.teachers[0]?.teacherId,
                    sessionDuration: e.class.sessionDuration,
                    sessionPrice: e.class.sessionPrice,
                }))
            );

        return NextResponse.json({
            debt,
            maxDebtLimit: user.maxDebtLimit,
            breakdown,
            payments,
            refundRequests,
            reschedulableSessions,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطا" }, { status: 500 });
    }
}