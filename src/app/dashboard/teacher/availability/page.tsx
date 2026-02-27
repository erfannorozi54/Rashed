"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Clock, Plus, Trash2, CalendarOff, Ban } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { toJalali } from "@/lib/jalali-utils";
import WeeklySchedulePreview, { type DaySchedule } from "@/components/ui/WeeklySchedulePreview";

const DAY_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

interface Slot { dayOfWeek: number; startTime: string; endTime: string }
interface Exception { id: string; date: string; type: string; startTime: string | null; endTime: string | null }

export default function TeacherAvailabilityPage() {
    const { data: session } = useSession();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [exceptions, setExceptions] = useState<Exception[]>([]);
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Exception form state
    const [exDate, setExDate] = useState("");
    const [exStart, setExStart] = useState("");
    const [exEnd, setExEnd] = useState("");
    const [exType, setExType] = useState<"BLOCKED" | "BUSY">("BLOCKED");

    const teacherId = session?.user?.id;

    const fetchData = () => {
        if (!teacherId) return;
        Promise.all([
            fetch(`/api/teachers/${teacherId}/availability`).then((r) => r.json()),
            fetch(`/api/teachers/${teacherId}/availability/weekly-schedule`).then((r) => r.json()),
        ]).then(([avail, sched]) => {
            setSlots(avail.slots || []);
            setExceptions(avail.exceptions || []);
            setSchedule(sched.schedule || []);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [teacherId]);

    const addSlot = (day: number) => setSlots([...slots, { dayOfWeek: day, startTime: "08:00", endTime: "18:00" }]);
    const removeSlot = (i: number) => setSlots(slots.filter((_, idx) => idx !== i));
    const updateSlot = (i: number, field: "startTime" | "endTime", val: string) => {
        const next = [...slots];
        next[i] = { ...next[i], [field]: val };
        setSlots(next);
    };

    const saveSlots = async () => {
        setSaving(true);
        await fetch(`/api/teachers/${teacherId}/availability`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slots }),
        });
        // Refresh schedule preview
        const sched = await fetch(`/api/teachers/${teacherId}/availability/weekly-schedule`).then((r) => r.json());
        setSchedule(sched.schedule || []);
        setSaving(false);
    };

    const addException = async () => {
        if (!exDate || (!exStart && exType === "BUSY")) return;
        const res = await fetch(`/api/teachers/${teacherId}/availability/exceptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: exDate, startTime: exStart || null, endTime: exEnd || null, type: exType }),
        });
        if (res.ok) {
            const data = await res.json();
            setExceptions([...exceptions, data.exception]);
            setExDate(""); setExStart(""); setExEnd("");
            // Refresh schedule
            const sched = await fetch(`/api/teachers/${teacherId}/availability/weekly-schedule`).then((r) => r.json());
            setSchedule(sched.schedule || []);
        }
    };

    const deleteException = async (id: string) => {
        await fetch(`/api/teachers/${teacherId}/availability/exceptions/${id}`, { method: "DELETE" });
        setExceptions(exceptions.filter((e) => e.id !== id));
        const sched = await fetch(`/api/teachers/${teacherId}/availability/weekly-schedule`).then((r) => r.json());
        setSchedule(sched.schedule || []);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--muted)]">
                <DashboardHeader title="مدیریت زمان آزاد" />
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                </div>
            </div>
        );
    }

    const blockedExceptions = exceptions.filter((e) => e.type !== "BUSY");
    const busyExceptions = exceptions.filter((e) => e.type === "BUSY");

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="مدیریت زمان آزاد" />
            <main className="container mx-auto px-4 py-8 space-y-6">
                {/* Weekly Preview */}
                {schedule.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>پیش‌نمایش هفتگی</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <WeeklySchedulePreview schedule={schedule} />
                        </CardContent>
                    </Card>
                )}

                {/* Recurring Slots */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                زمان‌های آزاد هفتگی
                            </CardTitle>
                            <Button onClick={saveSlots} disabled={saving}>
                                {saving ? "ذخیره..." : "ذخیره تغییرات"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {DAY_NAMES.map((name, day) => {
                                const daySlots = slots.map((s, i) => ({ ...s, idx: i })).filter((s) => s.dayOfWeek === day);
                                return (
                                    <div key={day} className="p-3 rounded-lg border border-[var(--border)]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">{name}</span>
                                            <Button size="sm" variant="ghost" onClick={() => addSlot(day)}>
                                                <Plus className="h-4 w-4 ml-1" />
                                                افزودن
                                            </Button>
                                        </div>
                                        {daySlots.length === 0 ? (
                                            <p className="text-sm text-[var(--muted-foreground)]">تعطیل</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {daySlots.map((s) => (
                                                    <div key={s.idx} className="flex items-center gap-2">
                                                        <Input type="time" value={s.startTime} onChange={(e) => updateSlot(s.idx, "startTime", e.target.value)} className="w-32" />
                                                        <span className="text-sm">تا</span>
                                                        <Input type="time" value={s.endTime} onChange={(e) => updateSlot(s.idx, "endTime", e.target.value)} className="w-32" />
                                                        <Button size="sm" variant="ghost" onClick={() => removeSlot(s.idx)} className="text-red-500">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Blocked Exceptions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarOff className="h-5 w-5" />
                            استثناها (روزهای بسته)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-end gap-3 flex-wrap">
                            <div className="space-y-1">
                                <Label>تاریخ</Label>
                                <Input type="date" value={exType === "BLOCKED" ? exDate : ""} onChange={(e) => { setExDate(e.target.value); setExType("BLOCKED"); }} className="w-40" />
                            </div>
                            <div className="space-y-1">
                                <Label>از ساعت (خالی = کل روز)</Label>
                                <Input type="time" value={exType === "BLOCKED" ? exStart : ""} onChange={(e) => { setExStart(e.target.value); setExType("BLOCKED"); }} className="w-32" />
                            </div>
                            <div className="space-y-1">
                                <Label>تا ساعت</Label>
                                <Input type="time" value={exType === "BLOCKED" ? exEnd : ""} onChange={(e) => { setExEnd(e.target.value); setExType("BLOCKED"); }} className="w-32" />
                            </div>
                            <Button onClick={() => { setExType("BLOCKED"); addException(); }}>افزودن</Button>
                        </div>
                        {blockedExceptions.length === 0 ? (
                            <p className="text-sm text-[var(--muted-foreground)]">استثنایی ثبت نشده</p>
                        ) : (
                            <div className="space-y-2">
                                {blockedExceptions.map((ex) => (
                                    <div key={ex.id} className="flex items-center justify-between p-3 rounded border border-[var(--border)]">
                                        <div>
                                            <span className="font-medium">{toJalali(ex.date)}</span>
                                            <span className="text-sm text-[var(--muted-foreground)] mr-2">
                                                {ex.startTime && ex.endTime ? `${ex.startTime} تا ${ex.endTime}` : "کل روز"}
                                            </span>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => deleteException(ex.id)} className="text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Busy Blocks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Ban className="h-5 w-5" />
                            زمان‌های مشغول (دستی)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-end gap-3 flex-wrap">
                            <div className="space-y-1">
                                <Label>تاریخ</Label>
                                <Input type="date" value={exType === "BUSY" ? exDate : ""} onChange={(e) => { setExDate(e.target.value); setExType("BUSY"); }} className="w-40" />
                            </div>
                            <div className="space-y-1">
                                <Label>از ساعت</Label>
                                <Input type="time" value={exType === "BUSY" ? exStart : ""} onChange={(e) => { setExStart(e.target.value); setExType("BUSY"); }} className="w-32" />
                            </div>
                            <div className="space-y-1">
                                <Label>تا ساعت</Label>
                                <Input type="time" value={exType === "BUSY" ? exEnd : ""} onChange={(e) => { setExEnd(e.target.value); setExType("BUSY"); }} className="w-32" />
                            </div>
                            <Button onClick={() => { setExType("BUSY"); addException(); }}>افزودن</Button>
                        </div>
                        {busyExceptions.length === 0 ? (
                            <p className="text-sm text-[var(--muted-foreground)]">زمان مشغولی ثبت نشده</p>
                        ) : (
                            <div className="space-y-2">
                                {busyExceptions.map((ex) => (
                                    <div key={ex.id} className="flex items-center justify-between p-3 rounded border border-red-200 bg-red-50">
                                        <div>
                                            <span className="font-medium">{toJalali(ex.date)}</span>
                                            <span className="text-sm text-[var(--muted-foreground)] mr-2">
                                                {ex.startTime && ex.endTime ? `${ex.startTime} تا ${ex.endTime}` : ""}
                                            </span>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => deleteException(ex.id)} className="text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
