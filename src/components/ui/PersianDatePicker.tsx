"use client";

import { useState, useEffect, useRef } from "react";
import moment from "moment-jalaali";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toJalali, getPersianMonthName, isToday } from "@/lib/jalali-utils";

interface PersianDatePickerProps {
    value?: Date;
    onChange: (date: Date) => void;
    label?: string;
    placeholder?: string;
    minDate?: Date;
    className?: string;
}

export default function PersianDatePicker({
    value,
    onChange,
    label,
    placeholder = "انتخاب تاریخ",
    minDate,
    className = "",
}: PersianDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(moment());
    const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(
        value ? moment(value) : null
    );
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            setSelectedDate(moment(value));
            // Only update current month if the new value is far from current view
            // This prevents jumping when selecting a date in the current view
            const mValue = moment(value);
            if (mValue.jYear() !== currentMonth.jYear() || mValue.jMonth() !== currentMonth.jMonth()) {
                setCurrentMonth(mValue);
            }
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handlePrevMonth = () => {
        setCurrentMonth(moment(currentMonth).subtract(1, "jMonth"));
    };

    const handleNextMonth = () => {
        setCurrentMonth(moment(currentMonth).add(1, "jMonth"));
    };

    const handleDateClick = (day: number) => {
        const newDate = moment(currentMonth).jDate(day);

        // Check minDate constraint
        if (minDate && newDate.isBefore(moment(minDate), 'day')) {
            return;
        }

        setSelectedDate(newDate);
        onChange(newDate.toDate());
        setIsOpen(false);
    };

    const generateDays = () => {
        const startOfMonth = moment(currentMonth).startOf("jMonth");
        const daysInMonth = moment.jDaysInMonth(currentMonth.jYear(), currentMonth.jMonth());
        const startDayOfWeek = startOfMonth.day(); // 0-6 (Sunday-Saturday)

        // Adjust for Persian week start (Saturday = 0 in our logic for display)
        // Moment .day() returns 0 for Sunday, 6 for Saturday
        // We want Saturday to be first.
        // Map: Sat(6)->0, Sun(0)->1, Mon(1)->2, ..., Fri(5)->6
        const firstDayIndex = (startDayOfWeek + 1) % 7;

        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(null);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <div
                    className="flex items-center justify-between w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white cursor-pointer hover:border-[var(--primary-600)] transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className={`text-sm ${!selectedDate ? "text-[var(--muted-foreground)]" : ""}`}>
                        {selectedDate ? toJalali(selectedDate.toDate()) : placeholder}
                    </span>
                    <CalendarIcon className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>

                {isOpen && (
                    <div className="absolute z-50 mt-1 w-64 bg-white border border-[var(--border)] rounded-lg shadow-lg p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-[var(--muted)] rounded-full"
                                type="button"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-semibold">
                                {getPersianMonthName(currentMonth.jMonth() + 1)} {currentMonth.jYear()}
                            </span>
                            <button
                                onClick={handleNextMonth}
                                className="p-1 hover:bg-[var(--muted)] rounded-full"
                                type="button"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Week Days */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map((day) => (
                                <div key={day} className="text-center text-xs text-[var(--muted-foreground)]">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {generateDays().map((day, index) => {
                                if (day === null) {
                                    return <div key={`empty-${index}`} />;
                                }

                                const date = moment(currentMonth).jDate(day);
                                const isSelected = selectedDate &&
                                    date.jYear() === selectedDate.jYear() &&
                                    date.jMonth() === selectedDate.jMonth() &&
                                    date.jDate() === selectedDate.jDate();

                                const isTodayDate = isToday(date.toDate());
                                const isDisabled = minDate && date.isBefore(moment(minDate), 'day');

                                return (
                                    <button
                                        key={day}
                                        onClick={() => !isDisabled && handleDateClick(day)}
                                        disabled={isDisabled}
                                        type="button"
                                        className={`
                                            h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors
                                            ${isSelected
                                                ? "bg-[var(--primary-600)] text-white"
                                                : isTodayDate
                                                    ? "text-[var(--primary-600)] font-bold border border-[var(--primary-600)]"
                                                    : "hover:bg-[var(--muted)]"
                                            }
                                            ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}
                                        `}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
