"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { toJalali, getPersianDayName } from "@/lib/jalali-utils";

interface FreeSlot { start: string; end: string }

export default function ReschedulePage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [sessionInfo, setSessionInfo] = useState<{ title: string; date: string; className: string; teacherId: string; sessionDuration: number; sessionPrice: number } | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<FreeSlot | null>(null);
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!session?.user?.id) return;
        fetch(`/api/students/${session.user.id}/account`).then((r) => r.json()).then((data) => {
            const s = (data.reschedulableSessions || []).find((rs: any) => rs.id === sessionId);
            if (s) {
                setSessionInfo({
                    title: s.title,
                    date: s.date,
                    className: s.className,
                    teacherId: s.teacherId,
                    sessionDuration: s.sessionDuration || 90,
                    sessionPrice: s.sessionPrice || 0,
                });
            }
        }).finally(() => setLoading(false));
    }, [session, sessionId]);

    const fetchSlots = async (date: string) => {
        if (!sessionInfo?.teacherId || !date) return;
        setSlotsLoading(true);
        setSelectedSlot(null);
        try {
            const res = await fetch(`/api/teachers/${sessionInfo.teacherId}/availability/free-slots?date=${date}&duration=${sessionInfo.sessionDuration}`);
            if (res.ok) {
                const { freeSlots: slots } = await res.json();
                setFreeSlots(slots || []);
            }
        } catch (e) { console.error(e); }
        finally { setSlotsLoading(false); }
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        fetchSlots(date);
    };

    const handleSubmit = async () => {
        if (!selectedSlot || !selectedDate) return;
        setSubmitting(true);
        try {
            const [h, m] = selectedSlot.start.split(":").map(Number);
            const newDate = new Date(selectedDate);
            newDate.setHours(h, m, 0, 0);

            const res = await fetch(`/api/sessions/${sessionId}/reschedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newDate: newDate.toISOString() }),
            });
            const data = await res.json();
            if (data.success) {
                alert("جلسه با موفقیت جابجا شد");
                router.push("/dashboard/student/account");
            } else if (data.requiresPayment) {
                alert(`بدهی شما از سقف مجاز بیشتر است. هزینه جابجایی: ${data.fee.toLocaleString()} تومان. لطفاً ابتدا بدهی خود را پرداخت کنید.`);
            } else {
                alert(data.error || "خطا");
            }
        } catch (e) { alert("خطا"); }
        finally { setSubmitting(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--muted)]">
                <DashboardHeader title="تغییر زمان جلسه" />
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" /></div>
            </div>
        );
    }

    if (!sessionInfo) {
        return (
            <div className="min-h-screen bg-[var(--muted)]">
                <DashboardHeader title="تغییر زمان جلسه" />
                <div className="text-center py-12 text-[var(--muted-foreground)]">جلسه یافت نشد</div>
            </div>
        );
    }

    const fee = Math.round(sessionInfo.sessionPrice * 0.2);

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="تغییر زمان جلسه" />
            <main className="container mx-auto px-4 py-8 space-y-6">
                {/* Session Info */}
                <Card>
                    <CardHeader><CardTitle>اطلاعات جلسه فعلی</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div><span className="text-[var(--muted-foreground)]">عنوان: </span>{sessionInfo.title}</div>
                            <div><span className="text-[var(--muted-foreground)]">کلاس: </span>{sessionInfo.className}</div>
                            <div><span className="text-[var(--muted-foreground)]">تاریخ: </span>{toJalali(sessionInfo.date)} — {getPersianDayName(sessionInfo.date)}</div>
                            <div><span className="text-[var(--muted-foreground)]">هزینه جابجایی: </span><span className="text-amber-700 font-medium">{fee.toLocaleString("fa-IR")} تومان</span></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Date Picker */}
                <Card>
                    <CardHeader><CardTitle>انتخاب تاریخ جدید</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="w-48" />

                        {slotsLoading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary-600)]" />}

                        {!slotsLoading && selectedDate && freeSlots.length === 0 && (
                            <p className="text-sm text-[var(--muted-foreground)]">زمان آزادی در این روز وجود ندارد</p>
                        )}

                        {freeSlots.length > 0 && (
                            <div>
                                <p className="text-sm font-medium mb-2">زمان‌های آزاد:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {freeSlots.map((slot) => (
                                        <button
                                            key={`${slot.start}-${slot.end}`}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`p-3 rounded-lg border text-center text-sm transition-all ${
                                                selectedSlot?.start === slot.start
                                                    ? "border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)] font-medium"
                                                    : "border-[var(--border)] hover:border-[var(--primary-300)]"
                                            }`}
                                        >
                                            {slot.start} — {slot.end}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleSubmit} disabled={!selectedSlot || submitting}>
                                {submitting ? "در حال ثبت..." : "تایید جابجایی"}
                            </Button>
                            <Button variant="outline" onClick={() => router.push("/dashboard/student/account")}>
                                انصراف
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
