"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    GraduationCap,
    BookOpen,
    Clock,
    Users,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
} from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { formatPersianDateLong } from "@/lib/jalali-utils";
import clsx from "clsx";

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

const CLASS_TYPE_MAP: Record<string, { label: string; cls: string }> = {
    PUBLIC: { label: "عمومی", cls: "bg-emerald-50 text-emerald-700" },
    SEMI_PRIVATE: { label: "نیمه‌خصوصی", cls: "bg-amber-50 text-amber-700" },
};

export default function StudentTeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [classes, setClasses] = useState<TeacherClass[]>([]);
    const [loadingTeacher, setLoadingTeacher] = useState(true);

    // Booking state
    const [selectedSpec, setSelectedSpec] = useState<string | null>(null); // null = not yet chosen, "" = none
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [booking, setBooking] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    useEffect(() => {
        Promise.all([
            fetch(`/api/teachers/${id}`).then((r) => r.json()),
            fetch(`/api/teachers/${id}/classes`).then((r) => r.json()),
        ]).then(([teacherData, classesData]) => {
            const t: Teacher = teacherData.teacher;
            setTeacher(t || null);
            setClasses(classesData.classes || []);
            // If teacher has no specializations, skip that step
            if (t && t.specializations.length === 0) setSelectedSpec("");
        }).finally(() => setLoadingTeacher(false));
    }, [id]);

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
    const selectedSpecInfo = teacher?.specializations.find((s) => s.id === selectedSpec);

    // Step visibility
    const hasSpecs = (teacher?.specializations.length ?? 0) > 0;
    const specChosen = !hasSpecs || selectedSpec !== null;
    const dateChosen = specChosen && selectedDate !== null;

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
            <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">

                {/* ── Teacher hero ─────────────────────────────────── */}
                <Card>
                    <CardContent className="pt-6 pb-5">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--secondary-500)] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                                {teacher.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl font-bold text-[var(--foreground)]">{teacher.name}</h1>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        استاد
                                    </span>
                                </div>
                                {teacher.specializations.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {teacher.specializations.map((s) => (
                                            <span
                                                key={s.id}
                                                className="text-xs bg-[var(--primary-50)] text-[var(--primary-700)] border border-[var(--primary-100)] rounded-full px-2.5 py-0.5"
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

                {/* ── Classes ──────────────────────────────────────── */}
                {classes.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-[var(--secondary-600)]" />
                                کلاس‌های استاد
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {classes.map((c) => {
                                const typeInfo = CLASS_TYPE_MAP[c.classType] ?? { label: c.classType, cls: "bg-gray-100 text-gray-600" };
                                return (
                                    <div key={c.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-white">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm">{c.name}</span>
                                                <span className={clsx("text-xs px-1.5 py-0.5 rounded-full", typeInfo.cls)}>{typeInfo.label}</span>
                                            </div>
                                            {c.description && (
                                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{c.description}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[var(--muted-foreground)]">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {c.studentCount} دانش‌آموز{c.maxCapacity ? ` از ${c.maxCapacity}` : ""}
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
                                            <span className="text-sm font-semibold text-[var(--primary-700)] shrink-0">
                                                {c.sessionPrice.toLocaleString("fa-IR")} تومان
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* ── Booking wizard ───────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-[var(--primary-600)]" />
                            رزرو جلسه خصوصی
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Step 1 — Specialization */}
                        {hasSpecs && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <StepBadge n={1} done={selectedSpec !== null} />
                                    <span className="text-sm font-medium">موضوع درس را انتخاب کنید</span>
                                    {selectedSpec !== null && (
                                        <button
                                            onClick={() => { setSelectedSpec(null); setSelectedDate(null); setSelectedSlot(null); }}
                                            className="mr-auto text-xs text-[var(--primary-600)] hover:underline"
                                        >
                                            تغییر
                                        </button>
                                    )}
                                </div>

                                {selectedSpec === null ? (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {teacher.specializations.map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedSpec(s.id)}
                                                className="flex items-start gap-3 p-3 rounded-xl border-2 border-[var(--border)] bg-white hover:border-[var(--primary-400)] transition-colors text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium">{s.content}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                                        {s.subject} · {s.grade}
                                                    </p>
                                                    <p className="text-xs font-semibold text-[var(--primary-700)] mt-1">
                                                        {s.price > 0 ? `${s.price.toLocaleString("fa-IR")} تومان` : "رایگان"}
                                                    </p>
                                                </div>
                                                <ChevronLeft className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--primary-50)] border border-[var(--primary-100)]">
                                        <CheckCircle2 className="h-4 w-4 text-[var(--primary-600)] shrink-0" />
                                        <span className="text-sm font-medium text-[var(--primary-700)]">
                                            {selectedSpecInfo ? selectedSpecInfo.content : "بدون موضوع خاص"}
                                        </span>
                                        {selectedSpecInfo && selectedSpecInfo.price > 0 && (
                                            <span className="mr-auto text-sm font-bold text-[var(--primary-700)]">
                                                {selectedSpecInfo.price.toLocaleString("fa-IR")} تومان
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2 — Date */}
                        {specChosen && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <StepBadge n={hasSpecs ? 2 : 1} done={!!selectedDate} />
                                    <span className="text-sm font-medium">تاریخ جلسه را انتخاب کنید</span>
                                    {selectedDate && (
                                        <button
                                            onClick={() => { setSelectedDate(null); setSelectedSlot(null); }}
                                            className="mr-auto text-xs text-[var(--primary-600)] hover:underline"
                                        >
                                            تغییر
                                        </button>
                                    )}
                                </div>

                                {!selectedDate ? (
                                    <PersianDatePicker
                                        value={undefined}
                                        onChange={setSelectedDate}
                                        placeholder="تاریخ جلسه را انتخاب کنید"
                                        minDate={today}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--primary-50)] border border-[var(--primary-100)]">
                                        <CheckCircle2 className="h-4 w-4 text-[var(--primary-600)] shrink-0" />
                                        <span className="text-sm font-medium text-[var(--primary-700)]">
                                            {formatPersianDateLong(selectedDate)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3 — Time slot */}
                        {dateChosen && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <StepBadge n={hasSpecs ? 3 : 2} done={!!selectedSlot} />
                                    <span className="text-sm font-medium">ساعت جلسه را انتخاب کنید</span>
                                    <span className="mr-auto text-xs text-[var(--muted-foreground)]">مدت: ۹۰ دقیقه</span>
                                </div>

                                {slotsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary-600)]" />
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 gap-2 text-[var(--muted-foreground)]">
                                        <Clock className="h-9 w-9 opacity-30" />
                                        <p className="text-sm">در این تاریخ وقت آزادی وجود ندارد</p>
                                        <button
                                            onClick={() => { setSelectedDate(null); setSelectedSlot(null); }}
                                            className="text-xs text-[var(--primary-600)] hover:underline mt-1"
                                        >
                                            تاریخ دیگری انتخاب کنید
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {availableSlots.map((slot) => {
                                            const endTime = minToTime(timeToMin(slot) + 90);
                                            const isSelected = selectedSlot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                                                    className={clsx(
                                                        "flex flex-col items-center py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]",
                                                        isSelected
                                                            ? "bg-[var(--primary-600)] text-white border-[var(--primary-600)] shadow-md scale-105"
                                                            : "bg-white border-[var(--border)] hover:border-[var(--primary-400)] hover:shadow-sm"
                                                    )}
                                                >
                                                    <span>{slot}</span>
                                                    <span className={clsx("text-xs mt-0.5", isSelected ? "text-white/80" : "text-[var(--muted-foreground)]")}>
                                                        تا {endTime}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Confirm panel */}
                        {selectedDate && selectedSlot && (
                            <div className="rounded-2xl border border-[var(--primary-200)] bg-gradient-to-b from-[var(--primary-50)] to-white p-4 space-y-4">
                                <p className="text-sm font-semibold text-[var(--primary-800)]">خلاصه رزرو</p>
                                <div className="space-y-2 text-sm">
                                    <Row label="استاد" value={teacher.name} />
                                    {selectedSpecInfo && <Row label="موضوع" value={selectedSpecInfo.content} />}
                                    <Row label="تاریخ" value={formatPersianDateLong(selectedDate)} />
                                    <Row label="ساعت" value={`${selectedSlot} تا ${minToTime(timeToMin(selectedSlot) + 90)}`} />
                                    <Row label="مدت" value="۹۰ دقیقه" />
                                    <div className="flex justify-between border-t border-[var(--primary-200)] pt-2.5">
                                        <span className="text-[var(--muted-foreground)]">مبلغ قابل پرداخت</span>
                                        <span className="font-bold text-base text-[var(--primary-700)]">
                                            {selectedSpecInfo?.price
                                                ? `${selectedSpecInfo.price.toLocaleString("fa-IR")} تومان`
                                                : "رایگان"}
                                        </span>
                                    </div>
                                </div>

                                {bookingError && (
                                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                                        {bookingError}
                                    </p>
                                )}

                                <Button className="w-full" onClick={handleBook} disabled={booking}>
                                    {booking ? "در حال ثبت رزرو..." : "تأیید و پرداخت"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

function StepBadge({ n, done }: { n: number; done: boolean }) {
    const persianNums = ["۱", "۲", "۳", "۴"];
    return (
        <span
            className={clsx(
                "w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0 transition-colors",
                done
                    ? "bg-emerald-500 text-white"
                    : "bg-[var(--primary-600)] text-white"
            )}
        >
            {done ? <CheckCircle2 className="h-4 w-4" /> : persianNums[n - 1]}
        </span>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">{label}</span>
            <span className="font-medium text-left">{value}</span>
        </div>
    );
}
