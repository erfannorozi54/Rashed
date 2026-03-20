"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    ChevronRight,
    ChevronLeft,
    GraduationCap,
    BookOpen,
    Clock,
    Users,
    CalendarDays,
} from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import WeeklySchedulePreview, { type DaySchedule } from "@/components/ui/WeeklySchedulePreview";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { toJalali, formatPersianDateLong } from "@/lib/jalali-utils";

interface Specialization {
    id: string;
    subject: string;
    grade: string;
    content: string;
    price: number;
}

interface Teacher {
    id: string;
    name: string;
    role: string;
    specializations: Specialization[];
}

interface TeacherClass {
    id: string;
    name: string;
    description: string | null;
    classType: string;
    maxCapacity: number | null;
    sessionPrice: number;
    studentCount: number;
    nextSession: { date: string } | null;
}

interface FreeSlot {
    start: string;
    end: string;
}

function minToTime(m: number): string {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function timeToMin(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function generate90MinSlots(freeSlots: FreeSlot[]): string[] {
    const slots: string[] = [];
    for (const s of freeSlots) {
        const start = timeToMin(s.start);
        const end = timeToMin(s.end);
        for (let t = start; t + 90 <= end; t += 30) {
            slots.push(minToTime(t));
        }
    }
    return Array.from(new Set(slots)).sort();
}

export default function StudentTeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [classes, setClasses] = useState<TeacherClass[]>([]);
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loadingTeacher, setLoadingTeacher] = useState(true);
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);

    // Booking state
    const [selectedSpec, setSelectedSpec] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [booking, setBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDateForOffset = (offset: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offset * 7);
        return d.toISOString().split("T")[0];
    };

    useEffect(() => {
        Promise.all([
            fetch(`/api/teachers/${id}`).then((r) => r.json()),
            fetch(`/api/teachers/${id}/classes`).then((r) => r.json()),
        ]).then(([teacherData, classesData]) => {
            setTeacher(teacherData.teacher || null);
            setClasses(classesData.classes || []);
        }).finally(() => setLoadingTeacher(false));
    }, [id]);

    useEffect(() => {
        setLoadingSchedule(true);
        const date = getDateForOffset(weekOffset);
        fetch(`/api/teachers/${id}/availability/weekly-schedule?date=${date}`)
            .then((r) => r.json())
            .then((d) => setSchedule(d.schedule || []))
            .finally(() => setLoadingSchedule(false));
    }, [id, weekOffset]);

    useEffect(() => {
        if (!selectedDate) {
            setFreeSlots([]);
            setSelectedSlot(null);
            return;
        }
        setSlotsLoading(true);
        setSelectedSlot(null);
        setBookingError(null);
        const dateStr = selectedDate.toISOString().split("T")[0];
        fetch(`/api/teachers/${id}/availability/free-slots?date=${dateStr}&duration=90`)
            .then((r) => r.json())
            .then((d) => setFreeSlots(Array.isArray(d.freeSlots) ? d.freeSlots : []))
            .catch(() => setFreeSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [id, selectedDate]);

    const availableSlots = generate90MinSlots(freeSlots);

    const handleBook = async () => {
        if (!selectedDate || !selectedSlot) return;
        setBooking(true);
        setBookingError(null);
        try {
            const res = await fetch("/api/private-bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherId: id,
                    specializationId: selectedSpec || null,
                    date: selectedDate.toISOString(),
                    startTime: selectedSlot,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setBookingError(data.error || "خطا در ثبت رزرو");
                return;
            }
            router.push(data.redirectUrl);
        } catch {
            setBookingError("خطا در ثبت رزرو");
        } finally {
            setBooking(false);
        }
    };

    const weekLabel =
        schedule.length >= 2
            ? `${toJalali(schedule[0].date, "jDD jMMMM")} تا ${toJalali(
                  schedule[6]?.date || schedule[schedule.length - 1].date,
                  "jDD jMMMM jYYYY"
              )}`
            : "";

    const selectedSpecInfo = teacher?.specializations.find((s) => s.id === selectedSpec);

    const classTypeLabel = (type: string) => {
        if (type === "PUBLIC") return { label: "عمومی", cls: "bg-emerald-50 text-emerald-700" };
        if (type === "SEMI_PRIVATE") return { label: "نیمه‌خصوصی", cls: "bg-amber-50 text-amber-700" };
        return { label: type, cls: "bg-gray-100 text-gray-600" };
    };

    const stepNumber = (n: number) =>
        ["۱", "۲", "۳"][n - 1] || String(n);

    if (loadingTeacher) {
        return (
            <div className="min-h-screen bg-[var(--muted)]">
                <DashboardHeader title="پروفایل استاد" backHref="/dashboard/student/teachers" />
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                </div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="min-h-screen bg-[var(--muted)]">
                <DashboardHeader title="پروفایل استاد" backHref="/dashboard/student/teachers" />
                <main className="container mx-auto px-4 py-8">
                    <p className="text-center text-[var(--muted-foreground)]">استاد یافت نشد</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader
                title={`پروفایل ${teacher.name}`}
                backHref="/dashboard/student/teachers"
            />
            <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">

                {/* Teacher header card */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--secondary-500)] flex items-center justify-center text-white text-xl font-bold shrink-0">
                                {teacher.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl font-bold text-[var(--foreground)]">
                                        {teacher.name}
                                    </h1>
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                        استاد
                                    </span>
                                </div>
                                {teacher.specializations.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {teacher.specializations.map((s) => (
                                            <span
                                                key={s.id}
                                                className="inline-block text-xs bg-[var(--primary-50)] text-[var(--primary-700)] border border-[var(--primary-100)] rounded-full px-2.5 py-0.5"
                                            >
                                                {s.content}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Classes */}
                {classes.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BookOpen className="h-4 w-4 text-[var(--secondary-600)]" />
                                کلاس‌های استاد
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {classes.map((c) => {
                                    const { label, cls } = classTypeLabel(c.classType);
                                    return (
                                        <div
                                            key={c.id}
                                            className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[var(--border)] bg-white"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-sm text-[var(--foreground)]">
                                                        {c.name}
                                                    </span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>
                                                        {label}
                                                    </span>
                                                </div>
                                                {c.description && (
                                                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                                                        {c.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--muted-foreground)]">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {c.studentCount} دانش‌آموز
                                                        {c.maxCapacity ? ` / ${c.maxCapacity}` : ""}
                                                    </span>
                                                    {c.nextSession && (
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="h-3 w-3" />
                                                            جلسه بعدی: {formatPersianDateLong(c.nextSession.date)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {c.sessionPrice > 0 && (
                                                <div className="text-sm font-semibold text-[var(--primary-700)] shrink-0">
                                                    {c.sessionPrice.toLocaleString("fa-IR")} تومان
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Weekly schedule */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-[var(--secondary-600)]" />
                                برنامه هفتگی
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setWeekOffset((o) => o - 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                    هفته قبل
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setWeekOffset(0)}
                                    disabled={weekOffset === 0}
                                >
                                    این هفته
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setWeekOffset((o) => o + 1)}
                                >
                                    هفته بعد
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {weekLabel && (
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">{weekLabel}</p>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loadingSchedule ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                            </div>
                        ) : (
                            <WeeklySchedulePreview schedule={schedule} />
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
                                وقت آزاد
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
                                مشغول
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" />
                                غیرفعال
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Book a private session */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-[var(--primary-600)]" />
                        رزرو جلسه خصوصی
                    </h2>

                    {/* Step 1: Specialization (optional) */}
                    {teacher.specializations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[var(--primary-600)] text-white text-xs flex items-center justify-center font-bold">
                                        {stepNumber(1)}
                                    </span>
                                    موضوع درس (اختیاری)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <select
                                    value={selectedSpec}
                                    onChange={(e) => setSelectedSpec(e.target.value)}
                                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]"
                                >
                                    <option value="">موضوع درس را انتخاب کنید (اختیاری)</option>
                                    {teacher.specializations.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.content} —{" "}
                                            {s.price > 0
                                                ? `${s.price.toLocaleString("fa-IR")} تومان`
                                                : "رایگان"}
                                        </option>
                                    ))}
                                </select>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Date */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[var(--primary-600)] text-white text-xs flex items-center justify-center font-bold">
                                    {stepNumber(teacher.specializations.length > 0 ? 2 : 1)}
                                </span>
                                انتخاب تاریخ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PersianDatePicker
                                value={selectedDate || undefined}
                                onChange={setSelectedDate}
                                placeholder="تاریخ جلسه را انتخاب کنید"
                                minDate={today}
                            />
                        </CardContent>
                    </Card>

                    {/* Step 3: Time slot */}
                    {selectedDate && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[var(--primary-600)] text-white text-xs flex items-center justify-center font-bold">
                                        {stepNumber(teacher.specializations.length > 0 ? 3 : 2)}
                                    </span>
                                    انتخاب ساعت
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {slotsLoading ? (
                                    <div className="flex justify-center py-6">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary-600)]" />
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="text-center py-6">
                                        <Clock className="h-8 w-8 mx-auto mb-2 text-[var(--muted-foreground)] opacity-40" />
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            در این تاریخ وقت آزادی وجود ندارد
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {availableSlots.map((slot) => {
                                            const endTime = minToTime(timeToMin(slot) + 90);
                                            return (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`p-2.5 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] ${
                                                        selectedSlot === slot
                                                            ? "bg-[var(--primary-600)] text-white border-[var(--primary-600)]"
                                                            : "bg-white border-[var(--border)] hover:border-[var(--primary-600)] hover:text-[var(--primary-600)]"
                                                    }`}
                                                >
                                                    <div>{slot}</div>
                                                    <div className="text-xs opacity-70">تا {endTime}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Summary & confirm */}
                    {selectedDate && selectedSlot && (
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <h3 className="font-semibold">خلاصه رزرو</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">استاد</span>
                                        <span className="font-medium">{teacher.name}</span>
                                    </div>
                                    {selectedSpecInfo && (
                                        <div className="flex justify-between">
                                            <span className="text-[var(--muted-foreground)]">موضوع</span>
                                            <span className="font-medium">{selectedSpecInfo.content}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">تاریخ</span>
                                        <span className="font-medium">
                                            {selectedDate.toLocaleDateString("fa-IR")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">ساعت</span>
                                        <span className="font-medium">
                                            {selectedSlot} تا {minToTime(timeToMin(selectedSlot) + 90)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">مدت</span>
                                        <span className="font-medium">۹۰ دقیقه</span>
                                    </div>
                                    <div className="flex justify-between border-t border-[var(--border)] pt-2">
                                        <span className="text-[var(--muted-foreground)]">مبلغ</span>
                                        <span className="font-bold text-[var(--primary-700)]">
                                            {selectedSpecInfo
                                                ? selectedSpecInfo.price > 0
                                                    ? `${selectedSpecInfo.price.toLocaleString("fa-IR")} تومان`
                                                    : "رایگان"
                                                : "رایگان"}
                                        </span>
                                    </div>
                                </div>

                                {bookingError && (
                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                        {bookingError}
                                    </p>
                                )}

                                <Button
                                    className="w-full"
                                    onClick={handleBook}
                                    disabled={booking}
                                >
                                    {booking ? "در حال ثبت رزرو..." : "رزرو و پرداخت"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
