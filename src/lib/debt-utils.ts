import { prisma } from "@/lib/prisma";

/**
 * Compute student debt = (sessionPrice × sessions in scope) − totalPaidAmount
 * Scope: past sessions (held, not cancelled) + upcoming sessions in next 30 days
 */
export async function computeStudentDebt(studentId: string): Promise<{
    debt: number;
    breakdown: { classId: string; className: string; sessionsInScope: number; sessionPrice: number; totalCost: number; paidAmount: number }[];
}> {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const enrollments = await prisma.classEnrollment.findMany({
        where: { studentId, status: "ENROLLED" },
        include: {
            class: {
                include: {
                    sessions: {
                        where: {
                            cancelled: false,
                            date: { lte: thirtyDaysLater },
                        },
                    },
                },
            },
        },
    });

    const breakdown = enrollments.map((e) => {
        const sessionsInScope = e.class.sessions.length;
        const totalCost = e.class.sessionPrice * sessionsInScope;
        return {
            classId: e.classId,
            className: e.class.name,
            sessionsInScope,
            sessionPrice: e.class.sessionPrice,
            totalCost,
            paidAmount: e.paidAmount,
        };
    });

    const debt = breakdown.reduce((sum, b) => sum + (b.totalCost - b.paidAmount), 0);

    return { debt: Math.max(0, debt), breakdown };
}
