"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import SessionPlannerCalendar from "@/components/ui/SessionPlannerCalendar";
import { Globe, Key, Lock, Calendar, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { toJalali } from "@/lib/jalali-utils";
import moment from "moment-jalaali";
import { cn } from "@/lib/utils";

type ClassType = "PUBLIC" | "SEMI_PRIVATE" | "PRIVATE";
type SessionTab = "recurring" | "custom";

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

export default function CreateClassPage() {
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

    // Section 2 — session planner
    const [sessionTab, setSessionTab] = useState<SessionTab>("recurring");
    const [plannedSessions, setPlannedSessions] = useState<PlannedSession[]>([]);
    const [sessionTime, setSessionTime] = useState("10:00");

    // Recurring config
    const [recurringStartDate, setRecurringStartDate] = useState<Date | null>(null);
    const [recurringDays, setRecurringDays] = useState<number[]>([]);
    const [recurringCount, setRecurringCount] = useState(12);
    const [previewDates, setPreviewDates] = useState<Date[]>([]);

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);

        try {
            const response = await fetch("/api/classes", {
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
                    scheduledSessions: plannedSessions.map((s) => ({
                        title: s.title,
                        date: s.date.toISOString(),
                        description: s.description,
                    })),
                }),
            });

            if (response.ok) {
                router.push("/dashboard/teacher/classes");
                router.refresh();
            } else {
                const data = await response.json();
                alert(data.error || "خطا در ایجاد کلاس");
            }
        } catch (error) {
            console.error("Error creating class:", error);
            alert("خطا در ایجاد کلاس");
        } finally {
            setLoading(false);
        }
    };

    if (session?.user?.role !== "TEACHER" && session?.user?.role !== "ADMIN") {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                        ایجاد کلاس جدید
                    </h1>
                    <p className="text-[var(--muted-foreground)]">
                        اطلاعات کلاس و برنامه جلسات را وارد کنید
                    </p>
                </div>
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
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="مثال: ریاضی پایه دهم"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">توضیحات (اختیاری)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="توضیحات درباره کلاس..."
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

                {/* Section 2 — Session Planner */}
                <Card>
                    <CardHeader>
                        <CardTitle>برنامه جلسات</CardTitle>
                        <CardDescription>
                            جلسات برنامه‌ریزی شده کلاس را تعریف کنید
                        </CardDescription>
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
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setRecurringCount(Number(e.target.value))
                                            }
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
                                        <Button type="button" onClick={handleAddRecurringToPlanned}>
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

                <div className="flex justify-end gap-4">
                    <Link href="/dashboard/teacher/classes">
                        <Button type="button" variant="outline">
                            انصراف
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading || !name.trim()}>
                        {loading ? "در حال ایجاد..." : "ایجاد کلاس"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
