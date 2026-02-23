"use client";

import { useState } from "react";
import moment from "moment-jalaali";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPersianMonthName, isToday } from "@/lib/jalali-utils";
import { cn } from "@/lib/utils";

export interface BusySlot {
    start: Date;
    end: Date;
    label: string;
}

interface SessionPlannerCalendarProps {
    plannedDates: Date[];
    busySlots?: BusySlot[];
    sessionDuration: number; // minutes
    mode: "view" | "pick";
    onDayClick?: (date: Date) => void;
    className?: string;
}

export default function SessionPlannerCalendar({
    plannedDates,
    busySlots = [],
    sessionDuration,
    mode,
    onDayClick,
    className,
}: SessionPlannerCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(moment());

    const handlePrevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, "jMonth"));
    const handleNextMonth = () => setCurrentMonth(moment(currentMonth).add(1, "jMonth"));

    const generateDays = () => {
        const startOfMonth = moment(currentMonth).startOf("jMonth");
        const daysInMonth = moment.jDaysInMonth(currentMonth.jYear(), currentMonth.jMonth());
        const startDayOfWeek = startOfMonth.day();
        const firstDayIndex = (startDayOfWeek + 1) % 7;

        const days: (number | null)[] = [];
        for (let i = 0; i < firstDayIndex; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const getPlannedForDay = (day: number) => {
        const date = moment(currentMonth).jDate(day);
        return plannedDates.filter((d) => {
            const m = moment(d);
            return (
                m.jYear() === date.jYear() &&
                m.jMonth() === date.jMonth() &&
                m.jDate() === date.jDate()
            );
        });
    };

    const hasBusyConflict = (day: number) => {
        const planned = getPlannedForDay(day);
        if (planned.length === 0) return false;

        return planned.some((plannedDate) => {
            const plannedStart = plannedDate.getTime();
            const plannedEnd = plannedStart + sessionDuration * 60 * 1000;

            return busySlots.some((slot) => {
                const slotStart = slot.start.getTime();
                const slotEnd = slot.end.getTime();
                // Overlap if planned start < slot end AND planned end > slot start
                return plannedStart < slotEnd && plannedEnd > slotStart;
            });
        });
    };

    const handleDayClick = (day: number) => {
        if (mode !== "pick" || !onDayClick) return;
        const date = moment(currentMonth).jDate(day).toDate();
        onDayClick(date);
    };

    const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

    // Planned sessions in this month for the side panel
    const plannedThisMonth = plannedDates
        .filter((d) => {
            const m = moment(d);
            return m.jYear() === currentMonth.jYear() && m.jMonth() === currentMonth.jMonth();
        })
        .sort((a, b) => a.getTime() - b.getTime());

    return (
        <div className={cn("flex flex-col lg:flex-row gap-4", className)}>
            {/* Calendar grid */}
            <div className="flex-1 bg-white border border-[var(--border)] rounded-lg p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-[var(--muted)] rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold">
                        {getPersianMonthName(currentMonth.jMonth() + 1)} {currentMonth.jYear()}
                    </span>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-[var(--muted)] rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </div>

                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {weekDays.map((d) => (
                        <div key={d} className="text-center text-xs text-[var(--muted-foreground)] py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                    {generateDays().map((day, index) => {
                        if (day === null) return <div key={`empty-${index}`} />;

                        const plannedCount = getPlannedForDay(day).length;
                        const hasConflict = hasBusyConflict(day);
                        const todayDate = isToday(moment(currentMonth).jDate(day).toDate());
                        const isPlanned = plannedCount > 0;

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    "relative h-9 w-full rounded-md text-sm flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none",
                                    isPlanned
                                        ? "bg-blue-500 text-white font-semibold"
                                        : todayDate
                                        ? "border-2 border-[var(--primary-600)] text-[var(--primary-600)] font-semibold"
                                        : mode === "pick"
                                        ? "hover:bg-[var(--muted)] cursor-pointer"
                                        : "cursor-default"
                                )}
                            >
                                {day}
                                {hasConflict && (
                                    <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500" />
                                )}
                                {isPlanned && plannedCount > 1 && (
                                    <span className="absolute top-0.5 left-0.5 text-[9px] bg-blue-700 rounded-full h-3 w-3 flex items-center justify-center">
                                        {plannedCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)] border-t border-[var(--border)] pt-2">
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded bg-blue-500" />
                        <span>جلسه برنامه‌ریزی شده</span>
                    </div>
                    {busySlots.length > 0 && (
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span>تداخل با برنامه معلم</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded border-2 border-[var(--primary-600)]" />
                        <span>امروز</span>
                    </div>
                </div>
            </div>

            {/* Side panel: planned sessions */}
            <div className="lg:w-56 bg-white border border-[var(--border)] rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3 text-[var(--foreground)]">
                    {getPersianMonthName(currentMonth.jMonth() + 1)} — {plannedThisMonth.length} جلسه
                </h4>
                {plannedThisMonth.length === 0 ? (
                    <p className="text-xs text-[var(--muted-foreground)]">
                        {mode === "pick" ? "روی روزهای تقویم کلیک کنید" : "جلسه‌ای برنامه‌ریزی نشده"}
                    </p>
                ) : (
                    <ul className="space-y-1.5">
                        {plannedThisMonth.map((d, i) => {
                            const m = moment(d);
                            const dateStr = `${m.jDate()} ${getPersianMonthName(m.jMonth() + 1)}`;
                            const timeStr = m.format("HH:mm");
                            const conflictCheck = busySlots.some((slot) => {
                                const plannedStart = d.getTime();
                                const plannedEnd = plannedStart + sessionDuration * 60 * 1000;
                                return plannedStart < slot.end.getTime() && plannedEnd > slot.start.getTime();
                            });
                            return (
                                <li
                                    key={i}
                                    className={cn(
                                        "text-xs px-2 py-1.5 rounded flex items-center justify-between gap-1",
                                        conflictCheck
                                            ? "bg-red-50 text-red-700"
                                            : "bg-blue-50 text-blue-700"
                                    )}
                                >
                                    <span>{dateStr}</span>
                                    <span className="font-mono">{timeStr}</span>
                                    {conflictCheck && <span title="تداخل">⚠</span>}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
