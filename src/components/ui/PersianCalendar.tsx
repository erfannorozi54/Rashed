"use client";

import { useState, useEffect } from "react";
import moment from "moment-jalaali";
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { toJalali, getPersianMonthName, isToday } from "@/lib/jalali-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

// Ensure moment uses Persian locale
moment.loadPersian({ usePersianDigits: true });

interface Session {
    id: string;
    title: string;
    date: string; // ISO string
    type: "SCHEDULED" | "COMPENSATORY";
    description?: string;
}

interface PersianCalendarProps {
    sessions: Session[];
    onMonthChange?: (date: Date) => void;
    className?: string;
}

export default function PersianCalendar({
    sessions,
    onMonthChange,
    className,
}: PersianCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(moment());
    const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(moment());

    // Notify parent when month changes (to fetch new data)
    useEffect(() => {
        if (onMonthChange) {
            onMonthChange(currentMonth.toDate());
        }
    }, [currentMonth.format("jYYYY/jMM")]);

    const handlePrevMonth = () => {
        setCurrentMonth(moment(currentMonth).subtract(1, "jMonth"));
    };

    const handleNextMonth = () => {
        setCurrentMonth(moment(currentMonth).add(1, "jMonth"));
    };

    const handleToday = () => {
        const today = moment();
        setCurrentMonth(today);
        setSelectedDate(today);
    };

    // Generate calendar grid
    const generateDays = () => {
        const startOfMonth = moment(currentMonth).startOf("jMonth");
        const daysInMonth = moment.jDaysInMonth(currentMonth.jYear(), currentMonth.jMonth());

        // Calculate start day of week (Saturday = 0, Friday = 6)
        // moment.day() returns Sun=0, Mon=1, ..., Sat=6
        // We want Sat=0, Sun=1, ..., Fri=6
        const startDayOfWeek = (startOfMonth.day() + 1) % 7;

        const days = [];

        // Previous month filler
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ type: "empty", key: `empty-${i}` });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = moment(currentMonth).jDate(i);
            const dateStr = date.format("YYYY-MM-DD");

            // Find sessions for this day
            const daySessions = sessions.filter(s =>
                moment(s.date).format("YYYY-MM-DD") === dateStr
            );

            days.push({
                type: "day",
                date: date,
                dayNumber: i,
                sessions: daySessions,
                key: `day-${i}`,
                isToday: isToday(date.toDate()),
                isSelected: selectedDate && date.isSame(selectedDate, 'day')
            });
        }

        return days;
    };

    const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
    const days = generateDays();

    // Get sessions for selected date
    const selectedDaySessions = selectedDate
        ? sessions.filter(s => moment(s.date).isSame(selectedDate, 'day'))
        : [];

    return (
        <div className={cn("flex flex-col lg:flex-row gap-6", className)}>
            {/* Calendar Section */}
            <div className="flex-1 bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-3xl overflow-hidden">
                {/* Header */}
                <div className="p-6 flex items-center justify-between bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)] text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                {getPersianMonthName(currentMonth.jMonth() + 1)} {currentMonth.jYear()}
                            </h2>
                            <p className="text-white/80 text-sm">
                                {currentMonth.format("jD jMMMM jYYYY")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToday}
                            className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
                        >
                            امروز
                        </button>
                        <div className="flex bg-white/20 rounded-full p-1 backdrop-blur-sm">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="p-6">
                    {/* Week Days Header */}
                    <div className="grid grid-cols-7 mb-4">
                        {weekDays.map((day) => (
                            <div key={day} className="text-center text-[var(--muted-foreground)] font-medium py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((item: any) => {
                            if (item.type === "empty") {
                                return <div key={item.key} className="aspect-square" />;
                            }

                            return (
                                <button
                                    key={item.key}
                                    onClick={() => setSelectedDate(item.date)}
                                    className={cn(
                                        "aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 group",
                                        item.isSelected
                                            ? "bg-[var(--primary-600)] text-white shadow-lg shadow-[var(--primary-600)]/30 scale-105 z-10"
                                            : "hover:bg-[var(--muted)] text-[var(--foreground)]",
                                        item.isToday && !item.isSelected && "border-2 border-[var(--primary-600)] text-[var(--primary-600)] font-bold"
                                    )}
                                >
                                    <span className="text-lg">{item.dayNumber}</span>

                                    {/* Session Indicators */}
                                    <div className="flex gap-1 mt-1 absolute bottom-2">
                                        {item.sessions.slice(0, 3).map((s: Session, i: number) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    item.isSelected ? "bg-white" : (
                                                        s.type === "COMPENSATORY" ? "bg-orange-500" : "bg-blue-500"
                                                    )
                                                )}
                                            />
                                        ))}
                                        {item.sessions.length > 3 && (
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                item.isSelected ? "bg-white" : "bg-gray-400"
                                            )} />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Side Panel / Details */}
            <div className="w-full lg:w-80 shrink-0">
                <div className="bg-white border border-[var(--border)] rounded-3xl shadow-sm p-6 h-full flex flex-col">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[var(--primary-600)]" />
                        برنامه {selectedDate ? selectedDate.format("jD jMMMM") : "انتخاب شده"}
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                        {selectedDaySessions.length > 0 ? (
                            selectedDaySessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all hover:shadow-md",
                                        session.type === "COMPENSATORY"
                                            ? "bg-orange-50 border-orange-100"
                                            : "bg-blue-50 border-blue-100"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-1 rounded-full",
                                            session.type === "COMPENSATORY"
                                                ? "bg-orange-200 text-orange-700"
                                                : "bg-blue-200 text-blue-700"
                                        )}>
                                            {session.type === "COMPENSATORY" ? "جبرانی" : "عادی"}
                                        </span>
                                        <span className="text-xs text-[var(--muted-foreground)] font-mono">
                                            {moment(session.date).format("HH:mm")}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-[var(--foreground)] mb-1">
                                        {session.title}
                                    </h4>
                                    {session.description && (
                                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                                            {session.description}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-[var(--muted-foreground)]">
                                <div className="bg-[var(--muted)] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CalendarIcon className="w-8 h-8 opacity-50" />
                                </div>
                                <p>هیچ کلاسی برای این روز یافت نشد</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
