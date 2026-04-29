"use client";

import { useState, useEffect } from "react";
import moment from "moment-jalaali";
import { ChevronRight, ChevronLeft, Calendar } from "lucide-react";
import { toJalali, getPersianDayName, formatTime, getPersianMonthName } from "@/lib/jalali-utils";
import { cn } from "@/lib/utils";

moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

interface Session {
    id: string;
    title: string;
    date: string;
    type: "SCHEDULED" | "COMPENSATORY" | "PRIVATE";
    class?: {
        id: string;
        name: string;
        sessionDuration: number;
    };
}

interface MiniCalendarProps {
    sessions: Session[];
    onMonthChange?: (startDate: Date, endDate: Date) => void;
    className?: string;
}

const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export default function MiniCalendar({
    sessions,
    onMonthChange,
    className,
}: MiniCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(moment());
    const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);

    useEffect(() => {
        if (onMonthChange) {
            const start = moment(currentMonth).startOf("jMonth").toDate();
            const end = moment(currentMonth).endOf("jMonth").toDate();
            onMonthChange(start, end);
        }
    }, [currentMonth.format("jYYYY-jMM")]);

    const goToPrevMonth = () => setCurrentMonth(moment(currentMonth).subtract(1, "jMonth"));
    const goToNextMonth = () => setCurrentMonth(moment(currentMonth).add(1, "jMonth"));
    const goToToday = () => {
        const today = moment();
        setCurrentMonth(today);
        setSelectedDate(today);
    };

    // Generate calendar days
    const generateDays = () => {
        const startOfMonth = moment(currentMonth).startOf("jMonth");
        const daysInMonth = moment.jDaysInMonth(currentMonth.jYear(), currentMonth.jMonth());
        const startDayOfWeek = (startOfMonth.day() + 1) % 7; // Saturday = 0

        const days = [];

        // Empty cells before first day
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ type: "empty", key: `empty-${i}` });
        }

        // Days of month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = moment(currentMonth).jDate(i);
            const dateStr = date.format("YYYY-MM-DD");
            const daySessions = sessions.filter((s) =>
                moment(s.date).format("YYYY-MM-DD") === dateStr
            );
            const isToday = date.isSame(moment(), "day");
            const isSelected = selectedDate && date.isSame(selectedDate, "day");

            days.push({
                type: "day",
                date,
                dayNumber: i,
                sessions: daySessions,
                key: `day-${i}`,
                isToday,
                isSelected,
            });
        }

        return days;
    };

    const days = generateDays();

    // Get sessions for selected date
    const selectedDaySessions = selectedDate
        ? sessions.filter((s) => moment(s.date).isSame(selectedDate, "day"))
        : [];

    return (
        <div className={cn("bg-white rounded-2xl border border-[var(--border)] shadow-sm", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--primary-600)]" />
                    <h3 className="font-semibold text-sm">
                        {getPersianMonthName(currentMonth.jMonth() + 1)} {currentMonth.jYear()}
                    </h3>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={goToToday}
                        className="px-2 py-0.5 text-xs text-[var(--primary-600)] hover:bg-[var(--primary-50)] rounded-md transition-colors"
                    >
                        امروز
                    </button>
                    <button
                        onClick={goToPrevMonth}
                        className="p-1 hover:bg-[var(--muted)] rounded-md transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="p-1 hover:bg-[var(--muted)] rounded-md transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-3">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                    {PERSIAN_WEEKDAYS.map((day) => (
                        <div key={day} className="text-center text-xs text-[var(--muted-foreground)] font-medium py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((item: any) => {
                        if (item.type === "empty") {
                            return <div key={item.key} className="aspect-square" />;
                        }

                        const hasSessions = item.sessions.length > 0;

                        return (
                            <button
                                key={item.key}
                                onClick={() => setSelectedDate(item.date)}
                                className={cn(
                                    "aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all",
                                    item.isSelected && "bg-[var(--primary-600)] text-white shadow-sm",
                                    item.isToday && !item.isSelected && "ring-2 ring-[var(--primary-600)] ring-offset-1",
                                    !item.isSelected && hasSessions && "bg-[var(--primary-50)]",
                                    !item.isSelected && !hasSessions && "hover:bg-[var(--muted)]"
                                )}
                            >
                                <span className="text-sm">{item.dayNumber}</span>
                                {hasSessions && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {item.sessions.slice(0, 3).map((_: any, i: number) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "w-1 h-1 rounded-full",
                                                    item.isSelected ? "bg-white/80" : "bg-[var(--primary-500)]"
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Sessions */}
            {selectedDate && (
                <div className="border-t border-[var(--border)] p-3">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            {getPersianDayName(selectedDate.toDate())} {toJalali(selectedDate.toDate())}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                            {selectedDaySessions.length} جلسه
                        </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                        {selectedDaySessions.length > 0 ? (
                            <div className="relative space-y-2">
                                {selectedDaySessions
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map((session, index) => {
                                        const startTime = moment(session.date);
                                        const duration = session.class?.sessionDuration || 60;
                                        const endTime = moment(session.date).add(duration, 'minutes');
                                        
                                        return (
                                            <div key={session.id} className="flex gap-2">
                                                <div className="flex flex-col items-center">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full shrink-0 mt-1.5",
                                                        session.type === "COMPENSATORY"
                                                            ? "bg-orange-500"
                                                            : session.type === "PRIVATE"
                                                            ? "bg-purple-500"
                                                            : "bg-blue-500"
                                                    )} />
                                                    {index < selectedDaySessions.length - 1 && (
                                                        <div className="w-px h-full bg-[var(--border)] mt-1" />
                                                    )}
                                                </div>
                                                <div className="flex-1 pb-2">
                                                    <div className="flex items-baseline gap-2 mb-0.5">
                                                        <span className="text-xs font-mono font-medium">
                                                            {startTime.format('HH:mm')}
                                                        </span>
                                                        <span className="text-[10px] text-[var(--muted-foreground)]">
                                                            {duration} دقیقه
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium mb-1">
                                                        {session.class?.name || session.title}
                                                    </p>
                                                    <span
                                                        className={cn(
                                                            "inline-block text-[10px] px-2 py-0.5 rounded-full",
                                                            session.type === "COMPENSATORY"
                                                                ? "bg-orange-100 text-orange-700"
                                                                : session.type === "PRIVATE"
                                                                ? "bg-purple-100 text-purple-700"
                                                                : "bg-blue-100 text-blue-700"
                                                        )}
                                                    >
                                                        {session.type === "COMPENSATORY"
                                                            ? "جبرانی"
                                                            : session.type === "PRIVATE"
                                                            ? "خصوصی"
                                                            : "عادی"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <p className="text-xs text-center text-[var(--muted-foreground)] py-4">
                                کلاسی در این روز ندارید
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
