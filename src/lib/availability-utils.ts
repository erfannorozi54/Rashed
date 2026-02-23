import { prisma } from "@/lib/prisma";

interface TimeSlot {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
}

/**
 * Convert JS Date dayOfWeek (0=Sun) to our system (0=Sat)
 */
function toSaturdayBased(jsDay: number): number {
    // JS: 0=Sun,1=Mon,...,6=Sat → Ours: 0=Sat,1=Sun,...,6=Fri
    return (jsDay + 1) % 7;
}

function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(m: number): string {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Subtract blocked intervals from available intervals
 */
function subtractSlots(available: TimeSlot[], blocked: TimeSlot[]): TimeSlot[] {
    let result = available.map((s) => ({
        startMin: timeToMinutes(s.start),
        endMin: timeToMinutes(s.end),
    }));

    for (const b of blocked) {
        const bStart = timeToMinutes(b.start);
        const bEnd = timeToMinutes(b.end);
        const next: typeof result = [];
        for (const r of result) {
            if (bEnd <= r.startMin || bStart >= r.endMin) {
                next.push(r);
            } else {
                if (r.startMin < bStart) next.push({ startMin: r.startMin, endMin: bStart });
                if (r.endMin > bEnd) next.push({ startMin: bEnd, endMin: r.endMin });
            }
        }
        result = next;
    }

    return result.map((r) => ({ start: minutesToTime(r.startMin), end: minutesToTime(r.endMin) }));
}

/**
 * Get free time slots for a teacher on a specific date
 */
export async function getTeacherFreeSlots(
    teacherId: string,
    date: Date,
    durationMinutes: number
): Promise<TimeSlot[]> {
    const dayOfWeek = toSaturdayBased(date.getDay());

    // 1. Get recurring availability for this weekday
    const recurring = await prisma.teacherAvailability.findMany({
        where: { teacherId, dayOfWeek },
    });

    if (recurring.length === 0) return [];

    let available: TimeSlot[] = recurring.map((r) => ({
        start: r.startTime,
        end: r.endTime,
    }));

    // 2. Get exceptions for this date
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const exceptions = await prisma.availabilityException.findMany({
        where: { teacherId, date: dateOnly },
    });

    for (const ex of exceptions) {
        if (!ex.startTime || !ex.endTime) {
            // Full day block
            return [];
        }
        available = subtractSlots(available, [{ start: ex.startTime, end: ex.endTime }]);
    }

    // 3. Get busy slots from class sessions on this date
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const classTeachers = await prisma.classTeacher.findMany({
        where: { teacherId },
        include: {
            class: {
                select: {
                    sessionDuration: true,
                    sessions: {
                        where: { date: { gte: dayStart, lt: dayEnd }, cancelled: false },
                        select: { date: true },
                    },
                },
            },
        },
    });

    const busySlots: TimeSlot[] = classTeachers.flatMap((ct) =>
        ct.class.sessions.map((s) => {
            const start = new Date(s.date);
            const end = new Date(start.getTime() + ct.class.sessionDuration * 60 * 1000);
            return {
                start: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
                end: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
            };
        })
    );

    available = subtractSlots(available, busySlots);

    // 4. Filter slots that are long enough for the requested duration
    return available.filter((s) => timeToMinutes(s.end) - timeToMinutes(s.start) >= durationMinutes);
}
