"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import SessionPlannerCalendar, { BusySlot } from "@/components/ui/SessionPlannerCalendar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Globe, Key, Lock, GraduationCap, Calendar, Trash2, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { toJalali } from "@/lib/jalali-utils";
import moment from "moment-jalaali";
import { cn } from "@/lib/utils";

type ClassType = "PUBLIC" | "SEMI_PRIVATE" | "PRIVATE";
type SessionTab = "recurring" | "custom";

interface Teacher {
    id: string;
    name: string;
    phone: string;
}

interface Student {
    id: string;
    name: string;
    phone: string;
}

interface PlannedSession {
    id: string;
    title: string;
    date: Date;
    description?: string;
}

const CLASS_TYPE_OPTIONS: { value: ClassType; label: string; description: string; icon: React.ReactNode }[] = [
    {
        value: "PUBLIC",
        label: "عمومی",
        description: "دانش‌آموزان می‌توانند درخواست ثبت‌نام دهند",
        icon: <Globe className="h-5 w-5" />,
    },
    {
        value: "SEMI_PRIVATE",
        label: "نیمه خصوصی",
        description: "نیاز به کد دعوت",
        icon: <Key className="h-5 w-5" />,
    },
    {
        value: "PRIVATE",
        label: "خصوصی",
        description: "فقط ادمین دانش‌آموز تعیین می‌کند",
        icon: <Lock className="h-5 w-5" />,
    },
];

const WEEK_DAYS = [
    { label: "شنبه", value: 6 },
    { label: "یکشنبه", value: 0 },
    { label: "دوشنبه", value: 1 },
    { label: "سه‌شنبه", value: 2 },
    { label: "چهارشنبه", value: 3 },
    { label: "پنج‌شنبه", value: 4 },
    { label: "جمعه", value: 5 },
];

export default function AdminCreateClassPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);

    // Section 1 — basic info
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [classType, setClassType] = useState<ClassType>("PUBLIC");
    const [maxCapacity, setMaxCapacity] = useState("");
    const [sessionDuration, setSessionDuration] = useState("90");
    const [sessionPrice, setSessionPrice] = useState("0");

    const formatPrice = (val: string) => {
        const num = val.replace(/\D/g, "");
        return num ? Number(num).toLocaleString() : "";
    };
    const rawPrice = (val: string) => val.replace(/\D/g, "") || "0";
    const [minSessionsToPay, setMinSessionsToPay] = useState("");

    // Section 2 — teachers
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
    const [teacherBusySlots, setTeacherBusySlots] = useState<BusySlot[]>([]);

    // Section 4 — initial students
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [studentSearch, setStudentSearch] = useState("");

    // Section 3 — session planner
    const [sessionTab, setSessionTab] = useState<SessionTab>("recurring");
    const [plannedSessions, setPlannedSessions] = useState<PlannedSession[]>([]);
    const [sessionTime, setSessionTime] = useState("10:00");

    // Recurring config
    const [recurringStartDate, setRecurringStartDate] = useState<Date | null>(null);
    const [recurringDays, setRecurringDays] = useState<number[]>([]);
    const [recurringCount, setRecurringCount] = useState(12);
    const [previewDates, setPreviewDates] = useState<Date[]>([]);

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchTeachers();
        fetchStudents();
    }, [session, router]);

    const fetchTeachers = async () => {
        try {
            const res = await fetch("/api/users?role=TEACHER");
            const data = await res.json();
            if (res.ok) setTeachers(data.users || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch("/api/users?role=STUDENT");
            const data = await res.json();
            if (res.ok) setStudents(data.users || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBusySlotsForTeacher = async (teacherId: string): Promise<BusySlot[]> => {
        try {
            const res = await fetch(`/api/users/${teacherId}/schedule`);
            const data = await res.json();
            if (res.ok) {
                return (data.busySlots || []).map((s: any) => ({
                    start: new Date(s.start),
                    end: new Date(s.end),
                    label: s.className,
                }));
            }
        } catch (e) {
            console.error(e);
        }
        return [];
    };

    const toggleTeacher = async (id: string) => {
        const isSelected = selectedTeacherIds.includes(id);
        const newIds = isSelected
            ? selectedTeacherIds.filter((t) => t !== id)
            : [...selectedTeacherIds, id];
        setSelectedTeacherIds(newIds);

        // Rebuild busy slots for all selected teachers
        const slots = await Promise.all(
            newIds.map((tid) => fetchBusySlotsForTeacher(tid))
        );
        setTeacherBusySlots(slots.flat());
    };

    const toggleAdminAsTeacher = async () => {
        const adminId = session!.user.id;
        const isSelected = selectedTeacherIds.includes(adminId);
        const newIds = isSelected
            ? selectedTeacherIds.filter((t) => t !== adminId)
            : [...selectedTeacherIds, adminId];
        setSelectedTeacherIds(newIds);

        const slots = await Promise.all(
            newIds.map((tid) => fetchBusySlotsForTeacher(tid))
        );
        setTeacherBusySlots(slots.flat());
    };

    const toggleDay = (day: number) => {
        setRecurringDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const handleGeneratePreview = () => {
        if (!recurringStartDate || recurringDays.length === 0) return;

        const dates: Date[] = [];
        let current = moment(recurringStartDate);
        let count = 0;
        let iterations = 0;

        while (count < recurringCount && iterations < 365) {
            const dow = current.toDate().getDay();
            if (recurringDays.includes(dow)) {
                const d = current.toDate();
                const [h, m] = sessionTime.split(":").map(Number);
                d.setHours(h, m, 0, 0);
                dates.push(new Date(d));
                count++;
            }
            current.add(1, "day");
            iterations++;
        }

        setPreviewDates(dates);
    };

    const handleAddRecurringToPlanned = () => {
        const newSessions: PlannedSession[] = previewDates.map((d, i) => ({
            id: Math.random().toString(36).slice(2),
            title: `جلسه ${plannedSessions.length + i + 1}`,
            date: d,
        }));
        setPlannedSessions((prev) => [...prev, ...newSessions]);
        setPreviewDates([]);
    };

    const handleCalendarPick = (date: Date) => {
        const [h, m] = sessionTime.split(":").map(Number);
        date.setHours(h, m, 0, 0);

        // Toggle: if already in list on same date, remove; otherwise add
        const exists = plannedSessions.findIndex((s) => {
            const a = moment(s.date);
            const b = moment(date);
            return a.jYear() === b.jYear() && a.jMonth() === b.jMonth() && a.jDate() === b.jDate();
        });

        if (exists >= 0) {
            setPlannedSessions((prev) => prev.filter((_, i) => i !== exists));
        } else {
            setPlannedSessions((prev) => [
                ...prev,
                {
                    id: Math.random().toString(36).slice(2),
                    title: `جلسه ${prev.length + 1}`,
                    date: new Date(date),
                },
            ]);
        }
    };

    const handleRemoveSession = (id: string) => {
        setPlannedSessions((prev) => prev.filter((s) => s.id !== id));
    };

    const handleUpdateSessionTitle = (id: string, title: string) => {
        setPlannedSessions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, title } : s))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const res = await fetch("/api/classes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    classType,
                    maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
                    sessionDuration: Number(sessionDuration) || 90,
                    sessionPrice: Number(sessionPrice) || 0,
                    minSessionsToPay: minSessionsToPay !== "" ? Number(minSessionsToPay) : null,
                    teacherIds: selectedTeacherIds,
                    initialStudentIds: selectedStudentIds,
                    scheduledSessions: plannedSessions.map((s) => ({
                        title: s.title,
                        date: s.date.toISOString(),
                        description: s.description,
                    })),
                }),
            });

            const data = await res.json();
            if (res.ok) {
                router.push("/dashboard/admin/classes");
            } else {
                alert(data.error || "خطا در ایجاد کلاس");
            }
        } catch (e) {
            console.error(e);
            alert("خطا در ایجاد کلاس");
        } finally {
            setLoading(false);
        }
    };

    if (session?.user?.role !== "ADMIN") return null;

    const calendarDates =
        sessionTab === "recurring" ? previewDates : plannedSessions.map((s) => s.date);

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="ایجاد کلاس جدید" />

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-1">ایجاد کلاس جدید</h1>
                        <p className="text-[var(--muted-foreground)]">اطلاعات کلاس و برنامه جلسات را وارد کنید</p>
                    </div>
                    <Link href="/dashboard/admin/classes">
                        <Button variant="outline">بازگشت</Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section 1 — Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>اطلاعات پایه</CardTitle>
                            <CardDescription>نام، نوع و ظرفیت کلاس را مشخص کنید</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">نام کلاس *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="مثال: ریاضی پایه دهم"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">توضیحات (اختیاری)</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="توضیح مختصری درباره این کلاس..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>نوع کلاس</Label>
                                <div className="grid sm:grid-cols-3 gap-3">
                                    {CLASS_TYPE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setClassType(opt.value)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none",
                                                classType === opt.value
                                                    ? "border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                                                    : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary-400)]"
                                            )}
                                        >
                                            {opt.icon}
                                            <span className="font-semibold text-sm">{opt.label}</span>
                                            <span className="text-xs opacity-70">{opt.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxCapacity">حداکثر ظرفیت (اختیاری)</Label>
                                    <Input
                                        id="maxCapacity"
                                        type="number"
                                        min="1"
                                        value={maxCapacity}
                                        onChange={(e) => setMaxCapacity(e.target.value)}
                                        placeholder="نامحدود"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sessionDuration">مدت هر جلسه (دقیقه)</Label>
                                    <Input
                                        id="sessionDuration"
                                        type="number"
                                        min="15"
                                        max="480"
                                        value={sessionDuration}
                                        onChange={(e) => setSessionDuration(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sessionPrice">هزینه هر جلسه</Label>
                                    <div className="relative">
                                        <Input
                                            id="sessionPrice"
                                            type="text"
                                            inputMode="numeric"
                                            value={formatPrice(sessionPrice)}
                                            onChange={(e) => setSessionPrice(rawPrice(e.target.value))}
                                            placeholder="0"
                                            className="pl-16"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">تومان</span>
                                    </div>
                                    {Number(sessionPrice) === 0 && (
                                        <p className="text-xs text-green-600">رایگان</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minSessionsToPay">حداقل جلسات برای پرداخت (اختیاری)</Label>
                                    <Input
                                        id="minSessionsToPay"
                                        type="number"
                                        min="0"
                                        value={minSessionsToPay}
                                        onChange={(e) => setMinSessionsToPay(e.target.value)}
                                        placeholder={`${plannedSessions.length || "کل جلسات"}`}
                                    />
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                        ۰ = ثبت‌نام رایگان | خالی = پرداخت کامل
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2 — Teacher Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>انتخاب معلم</CardTitle>
                            <CardDescription>
                                معلمان این کلاس را انتخاب کنید. بعد از انتخاب، ساعات اشغال آن‌ها روی تقویم نشان داده می‌شود.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {/* Admin as teacher option */}
                                {session?.user && (
                                    <button
                                        key="admin-self"
                                        type="button"
                                        onClick={toggleAdminAsTeacher}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border text-sm text-right transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none",
                                            selectedTeacherIds.includes(session.user.id)
                                                ? "border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                                                : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary-400)]"
                                        )}
                                    >
                                        <GraduationCap className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{session.user.name} (شما)</span>
                                    </button>
                                )}
                                {teachers.map((teacher) => (
                                    <button
                                        key={teacher.id}
                                        type="button"
                                        onClick={() => toggleTeacher(teacher.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border text-sm text-right transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none",
                                            selectedTeacherIds.includes(teacher.id)
                                                ? "border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                                                : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary-400)]"
                                        )}
                                    >
                                        <GraduationCap className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{teacher.name}</span>
                                    </button>
                                ))}
                                {teachers.length === 0 && !session?.user && (
                                    <p className="text-sm text-[var(--muted-foreground)] col-span-3">
                                        هیچ معلمی در سیستم ثبت نشده است
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3 — Session Planner */}
                    <Card>
                        <CardHeader>
                            <CardTitle>برنامه جلسات</CardTitle>
                            <CardDescription>جلسات کلاس را برنامه‌ریزی کنید</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Tabs */}
                            <div className="flex border-b border-[var(--border)]">
                                <button
                                    type="button"
                                    onClick={() => setSessionTab("recurring")}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                        sessionTab === "recurring"
                                            ? "border-[var(--primary-600)] text-[var(--primary-600)]"
                                            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                    )}
                                >
                                    تکرارشونده
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSessionTab("custom")}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                        sessionTab === "custom"
                                            ? "border-[var(--primary-600)] text-[var(--primary-600)]"
                                            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                    )}
                                >
                                    آزاد
                                </button>
                            </div>

                            {/* Recurring Tab */}
                            {sessionTab === "recurring" && (
                                <div className="space-y-4 p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>تاریخ شروع</Label>
                                            <PersianDatePicker
                                                value={recurringStartDate || undefined}
                                                onChange={(d) => setRecurringStartDate(d)}
                                                minDate={new Date()}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ساعت شروع</Label>
                                            <Input
                                                type="time"
                                                value={sessionTime}
                                                onChange={(e) => setSessionTime(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>تعداد جلسات</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={recurringCount}
                                                onChange={(e) => setRecurringCount(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>روزهای هفته</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {WEEK_DAYS.map((day) => (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => toggleDay(day.value)}
                                                    className={cn(
                                                        "px-3 py-1 rounded-full text-sm border transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none",
                                                        recurringDays.includes(day.value)
                                                            ? "bg-[var(--primary-600)] text-white border-[var(--primary-600)]"
                                                            : "bg-white text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
                                                    )}
                                                >
                                                    {day.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleGeneratePreview}
                                            disabled={!recurringStartDate || recurringDays.length === 0}
                                        >
                                            پیش‌نمایش
                                        </Button>
                                        {previewDates.length > 0 && (
                                            <Button
                                                type="button"
                                                onClick={handleAddRecurringToPlanned}
                                            >
                                                <Plus className="h-4 w-4 ml-1" />
                                                افزودن {previewDates.length} جلسه
                                            </Button>
                                        )}
                                    </div>

                                    {previewDates.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2">پیش‌نمایش ({previewDates.length} جلسه)</p>
                                            <SessionPlannerCalendar
                                                plannedDates={previewDates}
                                                busySlots={teacherBusySlots}
                                                sessionDuration={Number(sessionDuration) || 90}
                                                mode="view"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Custom Tab */}
                            {sessionTab === "custom" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]">
                                        <Label className="whitespace-nowrap">ساعت جلسات:</Label>
                                        <Input
                                            type="time"
                                            value={sessionTime}
                                            onChange={(e) => setSessionTime(e.target.value)}
                                            className="w-32"
                                        />
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            روی روزهای تقویم کلیک کنید تا جلسه اضافه یا حذف شود
                                        </p>
                                    </div>
                                    <SessionPlannerCalendar
                                        plannedDates={plannedSessions.map((s) => s.date)}
                                        busySlots={teacherBusySlots}
                                        sessionDuration={Number(sessionDuration) || 90}
                                        mode="pick"
                                        onDayClick={handleCalendarPick}
                                    />
                                </div>
                            )}

                            {/* Planned sessions list */}
                            {plannedSessions.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-[var(--muted-foreground)]">
                                        جلسات برنامه‌ریزی شده ({plannedSessions.length})
                                    </h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {[...plannedSessions]
                                            .sort((a, b) => a.date.getTime() - b.date.getTime())
                                            .map((s, idx) => (
                                                <div
                                                    key={s.id}
                                                    className="flex items-center gap-3 p-3 bg-white border border-[var(--border)] rounded-md"
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <Input
                                                            value={s.title}
                                                            onChange={(e) => handleUpdateSessionTitle(s.id, e.target.value)}
                                                            className="h-7 text-sm"
                                                        />
                                                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {toJalali(s.date)} — {moment(s.date).format("HH:mm")}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveSession(s.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section 4 — Initial Students */}
                    <Card>
                        <CardHeader>
                            <CardTitle>دانش‌آموزان اولیه (اختیاری)</CardTitle>
                            <CardDescription>
                                دانش‌آموزانی که می‌خواهید از همان ابتدا در این کلاس ثبت‌نام شوند
                                {Number(sessionPrice) > 0
                                    ? " — وضعیت: در انتظار پرداخت"
                                    : " — وضعیت: ثبت‌نام آزاد"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                                <Input
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    placeholder="جستجو بر اساس نام یا شماره..."
                                    className="pr-9"
                                />
                            </div>

                            {/* Selected chips */}
                            {selectedStudentIds.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedStudentIds.map((sid) => {
                                        const st = students.find((s) => s.id === sid);
                                        if (!st) return null;
                                        return (
                                            <span
                                                key={sid}
                                                className="flex items-center gap-1 px-3 py-1 bg-[var(--primary-100)] text-[var(--primary-700)] rounded-full text-sm"
                                            >
                                                {st.name}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedStudentIds((prev) => prev.filter((id) => id !== sid))
                                                    }
                                                    className="hover:text-red-600 focus-visible:outline-none"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Student list */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                {students
                                    .filter(
                                        (s) =>
                                            s.name.includes(studentSearch) ||
                                            s.phone.includes(studentSearch)
                                    )
                                    .map((student) => (
                                        <label
                                            key={student.id}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer transition-colors",
                                                selectedStudentIds.includes(student.id)
                                                    ? "border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                                                    : "border-[var(--border)] bg-white hover:border-[var(--primary-400)]"
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(student.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedStudentIds((prev) => [...prev, student.id]);
                                                    } else {
                                                        setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
                                                    }
                                                }}
                                                className="accent-[var(--primary-600)]"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{student.name}</p>
                                                <p className="text-xs text-[var(--muted-foreground)] font-mono">{student.phone}</p>
                                            </div>
                                        </label>
                                    ))}
                                {students.length === 0 && (
                                    <p className="text-sm text-[var(--muted-foreground)] col-span-3">
                                        هیچ دانش‌آموزی یافت نشد
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Link href="/dashboard/admin/classes">
                            <Button type="button" variant="outline">انصراف</Button>
                        </Link>
                        <Button type="submit" disabled={loading || !name.trim()}>
                            {loading ? "در حال ایجاد..." : "ایجاد کلاس"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
