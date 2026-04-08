import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPersianDayName, formatTime } from "@/lib/jalali-utils";

export async function GET(request: NextRequest) {
    try {
        const classes = await prisma.class.findMany({
            where: { classType: "PUBLIC" },
            include: {
                teachers: {
                    include: {
                        teacher: { select: { id: true, name: true } },
                    },
                },
                students: { select: { studentId: true, status: true } },
                sessions: { 
                    where: { cancelled: false },
                    select: { id: true, date: true },
                    orderBy: { date: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const now = new Date();

        const formatted = classes.map((cls) => {
            const heldSessions = cls.sessions.filter((s) => new Date(s.date) < now);
            const remainingSessions = cls.sessions.filter((s) => new Date(s.date) >= now);

            // Calculate class schedule pattern with days and times
            let scheduleInfo = "";
            let scheduleDetails = null;
            
            if (cls.sessions.length > 0) {
                // Get unique days with their times
                const dayTimeMap = new Map<number, Set<string>>();
                
                cls.sessions.forEach((session) => {
                    const date = new Date(session.date);
                    const dayOfWeek = date.getDay();
                    const time = formatTime(session.date);
                    
                    if (!dayTimeMap.has(dayOfWeek)) {
                        dayTimeMap.set(dayOfWeek, new Set());
                    }
                    dayTimeMap.get(dayOfWeek)!.add(time);
                });

                // Convert to array and sort by day (Saturday first for Persian calendar)
                const daysWithTimes = Array.from(dayTimeMap.entries())
                    .sort(([a], [b]) => {
                        // Persian week starts from Saturday (6)
                        const order = [6, 0, 1, 2, 3, 4, 5]; // Saturday, Sunday, Monday, ...
                        return order.indexOf(a) - order.indexOf(b);
                    });

                const allTimes = daysWithTimes.flatMap(([_, times]) => Array.from(times));
                
                // Get unique times and sort them
                const uniqueTimes = Array.from(new Set(allTimes)).sort();

                // Build schedule description
                // Create a reference date for each day of week to get Persian name
                if (daysWithTimes.length === 1) {
                    const [day, times] = daysWithTimes[0];
                    const timesArray = Array.from(times).sort();
                    // Create a date that falls on this day of week
                    const refDate = new Date();
                    refDate.setDate(refDate.getDate() + ((day - refDate.getDay() + 7) % 7));
                    const dayName = getPersianDayName(refDate);
                    
                    scheduleDetails = {
                        days: [dayName],
                        times: timesArray,
                    };
                    scheduleInfo = `${dayName}‌ها ساعت ${timesArray.join(" و ")}`;
                } else if (daysWithTimes.length === 2) {
                    const dayNamesList = daysWithTimes.map(([day]) => {
                        const refDate = new Date();
                        refDate.setDate(refDate.getDate() + ((day - refDate.getDay() + 7) % 7));
                        return getPersianDayName(refDate);
                    });
                    scheduleDetails = {
                        days: dayNamesList,
                        times: uniqueTimes,
                    };
                    scheduleInfo = `${dayNamesList[0]} و ${dayNamesList[1]} ساعت ${uniqueTimes.join(" و ")}`;
                } else {
                    const dayNamesList = daysWithTimes.map(([day]) => {
                        const refDate = new Date();
                        refDate.setDate(refDate.getDate() + ((day - refDate.getDay() + 7) % 7));
                        return getPersianDayName(refDate);
                    });
                    scheduleDetails = {
                        days: dayNamesList,
                        times: uniqueTimes,
                    };
                    scheduleInfo = `${dayNamesList.join("، ")} ساعت ${uniqueTimes.join(" و ")}`;
                }
            }

            return {
                id: cls.id,
                name: cls.name,
                description: cls.description,
                sessionPrice: cls.sessionPrice,
                minSessionsToPay: cls.minSessionsToPay,
                maxCapacity: cls.maxCapacity,
                sessionDuration: cls.sessionDuration,
                sessionCount: cls.sessions.length,
                heldSessionsCount: heldSessions.length,
                remainingSessionsCount: remainingSessions.length,
                scheduleInfo,
                scheduleDetails,
                studentCount: cls.students.filter((s) => s.status === "ENROLLED").length,
                teachers: cls.teachers.map((t) => t.teacher),
            };
        });

        return NextResponse.json({ classes: formatted }, { status: 200 });
    } catch (error) {
        console.error("Get public classes error:", error);
        return NextResponse.json(
            { error: "خطا در دریافت کلاس‌ها" },
            { status: 500 }
        );
    }
}
