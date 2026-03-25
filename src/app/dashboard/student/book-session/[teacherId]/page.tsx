"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Clock, Calendar, ChevronRight } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PersianDatePicker from "@/components/ui/PersianDatePicker";

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
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title={`رزرو جلسه با ${teacher.name}`} backHref="/dashboard/student/book-session" />
            <main className="container mx-auto px-4 py-8 max-w-2xl">

                {/* Teacher info */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-[var(--secondary-600)]" />
                            {teacher.name}
                        </CardTitle>
                    </CardHeader>
                    {teacher.specializations.length > 0 && (
                        <CardContent>
                            <p className="text-sm text-[var(--muted-foreground)] mb-2">تخصص‌های تدریس:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {teacher.specializations.map((s) => (
                                    <span
                                        key={s.id}
                                        className="inline-block text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5"
                                    >
                                        {s.content}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Step 1: Select specialization */}
                {teacher.specializations.length > 0 && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[var(--primary-600)] text-white text-xs flex items-center justify-center font-bold">۱</span>
                                موضوع درس
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <select
                                value={selectedSpec}
                                onChange={(e) => {
                                    setSelectedSpec(e.target.value);
                                    setSelectedDate(null);
                                    setSelectedSlot(null);
                                }}
                                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]"
                            >
                                <option value="">موضوع درس را انتخاب کنید</option>
                                {teacher.specializations.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.content} — {s.price > 0 ? `${s.price.toLocaleString("fa-IR")} تومان` : "رایگان"}
                                    </option>
                                ))}
                            </select>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Select date — shown only when spec is satisfied */}
                {(teacher.specializations.length === 0 || selectedSpec) && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[var(--primary-600)] text-white text-xs flex items-center justify-center font-bold">
                                    {teacher.specializations.length > 0 ? "۲" : "۱"}
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
                )}

                {/* Step 3: Select time slot */}
                {selectedDate && (
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[var(--primary-600)] text-white text-xs flex items-center justify-center font-bold">
                                    {teacher.specializations.length > 0 ? "۳" : "۲"}
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
                                    <Clock className="h-8 w-8 mx-auto mb-2 text-[var(--muted-foreground)] opacity-50" />
                                    <p className="text-sm text-[var(--muted-foreground)]">
                                        در این تاریخ وقت آزادی وجود ندارد
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {availableSlots.map((slot) => {
                                        const endMin = timeToMin(slot) + 90;
                                        const endTime = minToTime(endMin);
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

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
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
            </main>
        </div>
    );
}
