import { prisma } from "@/lib/prisma";

interface TimeSlot {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
}

export type SegmentState = "unavailable" | "available" | "busy";

export interface ScheduleSegment {
    start: string;
    end: string;
    state: SegmentState;
}

export interface DaySchedule {
    dayOfWeek: number; // 0=Sat..6=Fri
    date: string;      // ISO date string
    segments: ScheduleSegment[];
}

const WORK_START = "07:00";
const WORK_END = "22:00";

function toSaturdayBased(jsDay: number): number {
    return (jsDay + 1) % 7;
}

function timeToMin(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function minToTime(m: number): string {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Subtract blocked intervals from available intervals */
function subtractSlots(available: TimeSlot[], blocked: TimeSlot[]): TimeSlot[] {
    let result = available.map((s) => ({ s: timeToMin(s.start), e: timeToMin(s.end) }));
    for (const b of blocked) {
        const bs = timeToMin(b.start), be = timeToMin(b.end);
        const next: typeof result = [];
        for (const r of result) {
            if (be <= r.s || bs >= r.e) { next.push(r); }
            else {
                if (r.s < bs) next.push({ s: r.s, e: bs });
                if (r.e > be) next.push({ s: be, e: r.e });
            }
        }
        result = next;
    }
    return result.map((r) => ({ start: minToTime(r.s), end: minToTime(r.e) }));
}

/** Build sorted, non-overlapping segments for a full day (WORK_START–WORK_END) */
function buildDaySegments(
    availableSlots: TimeSlot[],
    busySlots: TimeSlot[],
): ScheduleSegment[] {
    const ws = timeToMin(WORK_START), we = timeToMin(WORK_END);

    // Collect events: available ranges and busy ranges
    type Ev = { min: number; state: SegmentState };
    const points = new Set<number>();
    points.add(ws);
    points.add(we);

    const avail = availableSlots
        .map((s) => ({ s: Math.max(timeToMin(s.start), ws), e: Math.min(timeToMin(s.end), we) }))
        .filter((s) => s.s < s.e);
    const busy = busySlots
        .map((s) => ({ s: Math.max(timeToMin(s.start), ws), e: Math.min(timeToMin(s.end), we) }))
        .filter((s) => s.s < s.e);

    for (const a of avail) { points.add(a.s); points.add(a.e); }
    for (const b of busy) { points.add(b.s); points.add(b.e); }

    const sorted = Array.from(points).sort((a, b) => a - b);
    const segments: ScheduleSegment[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
        const s = sorted[i], e = sorted[i + 1];
        if (s >= e) continue;
        const mid = (s + e) / 2;

        // Check busy first (takes priority)
        const isBusy = busy.some((b) => mid >= b.s && mid < b.e);
        const isAvail = avail.some((a) => mid >= a.s && mid < a.e);

        let state: SegmentState = "unavailable";
        if (isBusy) state = "busy";
        else if (isAvail) state = "available";

        // Merge with previous if same state
        const last = segments[segments.length - 1];
        if (last && last.state === state && timeToMin(last.end) === s) {
            last.end = minToTime(e);
        } else {
            segments.push({ start: minToTime(s), end: minToTime(e), state });
        }
    }

    return segments;
}

/** Get Saturday of the week containing the given date */
function getSaturdayOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const jsDay = d.getDay(); // 0=Sun
    const satBased = (jsDay + 1) % 7; // 0=Sat
    d.setDate(d.getDate() - satBased);
    return d;
}

/**
 * Get 3-state weekly schedule for a teacher
 */
export async function getTeacherWeeklySchedule(
    teacherId: string,
    anyDateInWeek: Date,
): Promise<DaySchedule[]> {
    const saturday = getSaturdayOfWeek(anyDateInWeek);
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(saturday);
        d.setDate(d.getDate() + i);
        return d;
    });

    const weekStart = weekDates[0];
    const weekEnd = new Date(weekDates[6]);
    weekEnd.setDate(weekEnd.getDate() + 1);

    // Fetch all data in parallel
    const [recurring, exceptions, classTeachers] = await Promise.all([
        prisma.teacherAvailability.findMany({ where: { teacherId } }),
        prisma.availabilityException.findMany({
            where: { teacherId, date: { gte: weekStart, lt: weekEnd } },
        }),
        prisma.classTeacher.findMany({
            where: { teacherId },
            include: {
                class: {
                    select: {
                        sessionDuration: true,
                        sessions: {
                            where: { date: { gte: weekStart, lt: weekEnd }, cancelled: false },
                            select: { date: true },
                        },
                    },
                },
            },
        }),
    ]);

    return weekDates.map((date, i) => {
        const dayOfWeek = i; // 0=Sat..6=Fri

        // 1. Available slots from recurring
        const dayRecurring = recurring.filter((r) => r.dayOfWeek === dayOfWeek);
        let availableSlots: TimeSlot[] = dayRecurring.map((r) => ({
            start: r.startTime,
            end: r.endTime,
        }));

        // 2. Apply BLOCKED exceptions (remove from available)
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayExceptions = exceptions.filter(
            (ex) => ex.date.getTime() === dateOnly.getTime()
        );
        const blockedExceptions = dayExceptions.filter((ex) => ex.type === "BLOCKED");
        for (const ex of blockedExceptions) {
            if (!ex.startTime || !ex.endTime) {
                availableSlots = []; // full day block
                break;
            }
            availableSlots = subtractSlots(availableSlots, [{ start: ex.startTime, end: ex.endTime }]);
        }

        // 3. Collect busy slots: manual BUSY exceptions + sessions
        const busySlots: TimeSlot[] = [];

        const busyExceptions = dayExceptions.filter((ex) => ex.type === "BUSY");
        for (const ex of busyExceptions) {
            if (ex.startTime && ex.endTime) {
                busySlots.push({ start: ex.startTime, end: ex.endTime });
            }
        }

        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        for (const ct of classTeachers) {
            for (const s of ct.class.sessions) {
                const sd = new Date(s.date);
                if (sd >= dayStart && sd < dayEnd) {
                    const endTime = new Date(sd.getTime() + ct.class.sessionDuration * 60 * 1000);
                    busySlots.push({
                        start: `${String(sd.getHours()).padStart(2, "0")}:${String(sd.getMinutes()).padStart(2, "0")}`,
                        end: `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`,
                    });
                }
            }
        }

        return {
            dayOfWeek,
            date: date.toISOString(),
            segments: buildDaySegments(availableSlots, busySlots),
        };
    });
}

/**
 * Get free time slots for a teacher on a specific date (existing function, kept for reschedule)
 */
export async function getTeacherFreeSlots(
    teacherId: string,
    date: Date,
    durationMinutes: number
): Promise<TimeSlot[]> {
    const dayOfWeek = toSaturdayBased(date.getDay());

    const recurring = await prisma.teacherAvailability.findMany({
        where: { teacherId, dayOfWeek },
    });
    if (recurring.length === 0) return [];

    let available: TimeSlot[] = recurring.map((r) => ({ start: r.startTime, end: r.endTime }));

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const exceptions = await prisma.availabilityException.findMany({
        where: { teacherId, date: dateOnly },
    });

    for (const ex of exceptions) {
        if (ex.type === "BUSY") continue; // busy doesn't remove availability for free-slot calc — it's occupied
        if (!ex.startTime || !ex.endTime) return [];
        available = subtractSlots(available, [{ start: ex.startTime, end: ex.endTime }]);
    }

    // Subtract busy (sessions + BUSY exceptions)
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

    // Also subtract manual BUSY exceptions
    for (const ex of exceptions) {
        if (ex.type === "BUSY" && ex.startTime && ex.endTime) {
            busySlots.push({ start: ex.startTime, end: ex.endTime });
        }
    }

    available = subtractSlots(available, busySlots);

    return available.filter((s) => timeToMin(s.end) - timeToMin(s.start) >= durationMinutes);
}
