"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Clock, Calendar, Check, AlertCircle, Loader2 } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { cn } from "@/lib/utils";
import { toJalali, formatTime } from "@/lib/jalali-utils";

interface Specialization {
    id: string;
    subject: string;
    grade: string;
    content: string;
    price: number;
}

interface FreeSlot {
    start: string;
    end: string;
}

interface Teacher {
    id: string;
    name: string;
    role: string;
    specializations: Specialization[];
}

function minToTime(m: number): string {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function timeToMin(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

// Generate all possible 90-min start times within a free slot
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

export default function TeacherBookPage() {
    const params = useParams();
    const router = useRouter();
    const teacherId = params.teacherId as string;

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedSpec, setSelectedSpec] = useState<string>("");
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/teachers`)
            .then((r) => r.json())
            .then((d) => {
                const found = (d.teachers || []).find((t: Teacher) => t.id === teacherId);
                setTeacher(found || null);
            })
            .finally(() => setLoading(false));
    }, [teacherId]);

    useEffect(() => {
        if (!selectedDate) {
            setFreeSlots([]);
            setSelectedSlot(null);
            return;
        }
        fetchFreeSlots(selectedDate);
    }, [selectedDate]);

    const fetchFreeSlots = async (date: Date) => {
        setSlotsLoading(true);
        setSelectedSlot(null);
        setError(null);
        try {
            const dateStr = date.toISOString().split("T")[0];
            const res = await fetch(
                `/api/teachers/${teacherId}/availability/free-slots?date=${dateStr}&duration=90`
            );
            const data = await res.json();
            setFreeSlots(Array.isArray(data.freeSlots) ? data.freeSlots : []);
        } catch {
            setFreeSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const availableSlots = generateSlots();

    function generateSlots() {
        return generate90MinSlots(freeSlots);
    }

    const handleBook = async () => {
        if (!selectedDate || !selectedSlot) return;
        if (teacher?.specializations.length && !selectedSpec) return;
        setBooking(true);
        setError(null);
        try {
            const res = await fetch("/api/private-bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherId,
                    specializationId: selectedSpec || null,
                    date: selectedDate.toISOString(),
                    startTime: selectedSlot,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "خطا در ثبت رزرو");
                return;
            }
            router.push(data.redirectUrl);
        } catch {
            setError("خطا در ثبت رزرو");
        } finally {
            setBooking(false);
        }
    };

    const selectedSpecInfo = teacher?.specializations.find((s) => s.id === selectedSpec);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--muted)]">
                <DashboardHeader title="رزرو جلسه" backHref="/dashboard/student/book-session" />
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                </div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="min-h-screen bg-[var(--muted)]">
                <DashboardHeader title="رزرو جلسه" backHref="/dashboard/student/book-session" />
                <main className="container mx-auto px-4 py-8">
                    <p className="text-center text-[var(--muted-foreground)]">استاد یافت نشد</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <DashboardHeader title={`رزرو جلسه با ${teacher.name}`} backHref="/dashboard/student/book-session" />
            
            <main className="container mx-auto px-4 py-6 lg:py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Progress indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-2 sm:gap-4">
                            {[
                                { num: 1, label: teacher.specializations.length > 0 ? "موضوع" : "تاریخ", active: true },
                                { num: 2, label: teacher.specializations.length > 0 ? "تاریخ" : "ساعت", active: teacher.specializations.length === 0 || !!selectedSpec },
                                { num: 3, label: teacher.specializations.length > 0 ? "ساعت" : "تایید", active: !!selectedDate },
                                ...(teacher.specializations.length > 0 ? [{ num: 4, label: "تایید", active: !!selectedSlot }] : []),
                            ].map((step, idx, arr) => (
                                <div key={step.num} className="flex items-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={cn(
                                            "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all",
                                            step.active 
                                                ? "bg-[var(--primary-600)] text-white shadow-lg shadow-blue-200" 
                                                : "bg-white text-gray-400 border-2 border-gray-200"
                                        )}>
                                            {step.active && idx < arr.length - 1 && selectedSlot ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : step.num}
                                        </div>
                                        <span className={cn(
                                            "text-xs sm:text-sm font-medium hidden sm:block",
                                            step.active ? "text-[var(--primary-700)]" : "text-gray-400"
                                        )}>{step.label}</span>
                                    </div>
                                    {idx < arr.length - 1 && (
                                        <div className={cn(
                                            "w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 transition-colors",
                                            arr[idx + 1].active ? "bg-[var(--primary-600)]" : "bg-gray-200"
                                        )} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Main booking flow */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Teacher card */}
                            <Card className="border-0 shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl font-bold text-gray-900 mb-1">{teacher.name}</h2>
                                            <p className="text-sm text-gray-500 mb-3">استاد تخصصی ریاضی</p>
                                            {teacher.specializations.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {teacher.specializations.map((s) => (
                                                        <span
                                                            key={s.id}
                                                            className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1"
                                                        >
                                                            <GraduationCap className="h-3 w-3" />
                                                            {s.content}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Step 1: Select specialization */}
                            {teacher.specializations.length > 0 && (
                                <Card className={cn(
                                    "border-0 shadow-md transition-all",
                                    !selectedSpec && "ring-2 ring-[var(--primary-600)] ring-opacity-50"
                                )}>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--primary-600)] text-white text-sm flex items-center justify-center font-bold">۱</div>
                                            <span>موضوع درس را انتخاب کنید</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {teacher.specializations.map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    setSelectedSpec(s.id);
                                                    setSelectedDate(null);
                                                    setSelectedSlot(null);
                                                }}
                                                className={cn(
                                                    "w-full p-4 rounded-xl border-2 text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]",
                                                    selectedSpec === s.id
                                                        ? "border-[var(--primary-600)] bg-blue-50 shadow-sm"
                                                        : "border-gray-200 bg-white hover:border-[var(--primary-400)] hover:shadow-sm"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                            selectedSpec === s.id 
                                                                ? "border-[var(--primary-600)] bg-[var(--primary-600)]" 
                                                                : "border-gray-300"
                                                        )}>
                                                            {selectedSpec === s.id && <Check className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{s.content}</p>
                                                            <p className="text-sm text-gray-500">{s.subject} - پایه {s.grade}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={cn(
                                                            "text-lg font-bold",
                                                            s.price > 0 ? "text-[var(--primary-700)]" : "text-green-600"
                                                        )}>
                                                            {s.price > 0 ? `${s.price.toLocaleString("fa-IR")}` : "رایگان"}
                                                        </p>
                                                        {s.price > 0 && <p className="text-xs text-gray-500">تومان</p>}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Step 2: Select date */}
                            {(teacher.specializations.length === 0 || selectedSpec) && (
                                <Card className={cn(
                                    "border-0 shadow-md transition-all",
                                    !selectedDate && (teacher.specializations.length === 0 || selectedSpec) && "ring-2 ring-[var(--primary-600)] ring-opacity-50"
                                )}>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--primary-600)] text-white text-sm flex items-center justify-center font-bold">
                                                {teacher.specializations.length > 0 ? "۲" : "۱"}
                                            </div>
                                            <span>تاریخ جلسه را انتخاب کنید</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <PersianDatePicker
                                            value={selectedDate || undefined}
                                            onChange={setSelectedDate}
                                            placeholder="روی تاریخ مورد نظر کلیک کنید"
                                            minDate={today}
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Step 3: Select time slot */}
                            {selectedDate && (
                                <Card className={cn(
                                    "border-0 shadow-md transition-all",
                                    !selectedSlot && "ring-2 ring-[var(--primary-600)] ring-opacity-50"
                                )}>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--primary-600)] text-white text-sm flex items-center justify-center font-bold">
                                                {teacher.specializations.length > 0 ? "۳" : "۲"}
                                            </div>
                                            <span>ساعت مناسب را انتخاب کنید</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {slotsLoading ? (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-600)] mb-3" />
                                                <p className="text-sm text-gray-500">در حال بارگذاری ساعات آزاد...</p>
                                            </div>
                                        ) : availableSlots.length === 0 ? (
                                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                                    <AlertCircle className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <p className="text-base font-medium text-gray-900 mb-1">وقت آزادی وجود ندارد</p>
                                                <p className="text-sm text-gray-500">لطفاً تاریخ دیگری را انتخاب کنید</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    {availableSlots.length} ساعت آزاد برای {toJalali(selectedDate)}
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {availableSlots.map((slot) => {
                                                        const endMin = timeToMin(slot) + 90;
                                                        const endTime = minToTime(endMin);
                                                        return (
                                                            <button
                                                                key={slot}
                                                                onClick={() => setSelectedSlot(slot)}
                                                                className={cn(
                                                                    "p-4 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]",
                                                                    selectedSlot === slot
                                                                        ? "border-[var(--primary-600)] bg-[var(--primary-600)] text-white shadow-lg shadow-blue-200"
                                                                        : "border-gray-200 bg-white hover:border-[var(--primary-400)] hover:shadow-md"
                                                                )}
                                                            >
                                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                                    <Clock className="h-4 w-4" />
                                                                    <span className="text-lg font-bold">{slot}</span>
                                                                </div>
                                                                <div className={cn(
                                                                    "text-xs",
                                                                    selectedSlot === slot ? "text-blue-100" : "text-gray-500"
                                                                )}>
                                                                    تا {endTime}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Summary sidebar */}
                        {selectedDate && selectedSlot && (
                            <div className="lg:col-span-1">
                                <div className="sticky top-4">
                                    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Check className="h-5 w-5 text-green-600" />
                                                خلاصه رزرو
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                                    <GraduationCap className="h-5 w-5 text-[var(--primary-600)] mt-0.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 mb-0.5">استاد</p>
                                                        <p className="font-semibold text-gray-900">{teacher.name}</p>
                                                    </div>
                                                </div>

                                                {selectedSpecInfo && (
                                                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                                        <GraduationCap className="h-5 w-5 text-[var(--primary-600)] mt-0.5 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-500 mb-0.5">موضوع درس</p>
                                                            <p className="font-semibold text-gray-900">{selectedSpecInfo.content}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                                    <Calendar className="h-5 w-5 text-[var(--primary-600)] mt-0.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 mb-0.5">تاریخ و ساعت</p>
                                                        <p className="font-semibold text-gray-900">{toJalali(selectedDate)}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {selectedSlot} تا {minToTime(timeToMin(selectedSlot) + 90)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                                    <Clock className="h-5 w-5 text-[var(--primary-600)] mt-0.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 mb-0.5">مدت جلسه</p>
                                                        <p className="font-semibold text-gray-900">۹۰ دقیقه</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-200 pt-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-sm text-gray-600">مبلغ قابل پرداخت</span>
                                                    <div className="text-left">
                                                        <p className={cn(
                                                            "text-2xl font-bold",
                                                            selectedSpecInfo && selectedSpecInfo.price > 0 ? "text-[var(--primary-700)]" : "text-green-600"
                                                        )}>
                                                            {selectedSpecInfo
                                                                ? selectedSpecInfo.price > 0
                                                                    ? selectedSpecInfo.price.toLocaleString("fa-IR")
                                                                    : "رایگان"
                                                                : "رایگان"}
                                                        </p>
                                                        {selectedSpecInfo && selectedSpecInfo.price > 0 && (
                                                            <p className="text-xs text-gray-500">تومان</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {error && (
                                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                        <p className="text-sm text-red-700 flex items-center gap-2">
                                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                                            {error}
                                                        </p>
                                                    </div>
                                                )}

                                                <Button
                                                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                                                    onClick={handleBook}
                                                    disabled={booking}
                                                >
                                                    {booking ? (
                                                        <>
                                                            <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                                            در حال ثبت...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="h-5 w-5 ml-2" />
                                                            تایید و پرداخت
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
