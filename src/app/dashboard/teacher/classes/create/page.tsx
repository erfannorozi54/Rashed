"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { toJalali } from "@/lib/jalali-utils";
import moment from "moment-jalaali";

interface ScheduledSession {
    id: string;
    title: string;
    date: Date;
    description?: string;
}

export default function CreateClassPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });
    const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
    const [activeTab, setActiveTab] = useState<"manual" | "auto">("manual");
    const [generationConfig, setGenerationConfig] = useState({
        startDate: null as Date | null,
        startTime: "10:00",
        count: 12,
        days: [] as number[], // 0-6, where 6 is Saturday (to match JS getDay() where 6 is Sat)
        // Actually, let's use JS standard: 0=Sun, 1=Mon, ..., 6=Sat
    });

    const [newSession, setNewSession] = useState<{
        title: string;
        date: Date | null;
        time: string;
        description: string;
    }>({
        title: "",
        date: null,
        time: "10:00",
        description: "",
    });

    const handleAddSession = () => {
        if (!newSession.title || !newSession.date) return;

        const dateWithTime = new Date(newSession.date);
        const [hours, minutes] = newSession.time.split(':').map(Number);
        dateWithTime.setHours(hours, minutes);

        setScheduledSessions([
            ...scheduledSessions,
            {
                id: Math.random().toString(36).substr(2, 9),
                title: newSession.title,
                date: dateWithTime,
                description: newSession.description,
            },
        ]);

        setNewSession({
            title: "",
            date: null,
            time: "10:00",
            description: "",
        });
    };

    const handleGenerateSessions = () => {
        if (!generationConfig.startDate || generationConfig.days.length === 0) return;

        const sessions: ScheduledSession[] = [];
        let currentDate = moment(generationConfig.startDate);
        let count = 0;

        // Safety break to prevent infinite loops
        let iterations = 0;
        const maxIterations = 365; // Limit to one year lookahead

        while (count < generationConfig.count && iterations < maxIterations) {
            // JS getDay(): Sun=0, Mon=1, ..., Sat=6
            // We need to match this with our checkbox values
            const dayOfWeek = currentDate.toDate().getDay();

            if (generationConfig.days.includes(dayOfWeek)) {
                const dateWithTime = currentDate.toDate();
                const [hours, minutes] = generationConfig.startTime.split(':').map(Number);
                dateWithTime.setHours(hours, minutes);

                sessions.push({
                    id: Math.random().toString(36).substr(2, 9) + count,
                    title: `جلسه ${count + 1}`,
                    date: dateWithTime,
                    description: "",
                });
                count++;
            }

            currentDate.add(1, 'day');
            iterations++;
        }

        setScheduledSessions([...scheduledSessions, ...sessions]);
        setActiveTab("manual"); // Switch to list view
    };

    const toggleDay = (day: number) => {
        const newDays = generationConfig.days.includes(day)
            ? generationConfig.days.filter(d => d !== day)
            : [...generationConfig.days, day];
        setGenerationConfig({ ...generationConfig, days: newDays });
    };

    const handleRemoveSession = (id: string) => {
        setScheduledSessions(scheduledSessions.filter((s) => s.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/classes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    scheduledSessions: scheduledSessions.map(s => ({
                        title: s.title,
                        date: s.date.toISOString(),
                        description: s.description
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
                <Link href="/dashboard/teacher/classes">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 ml-2" />
                        بازگشت
                    </Button>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>اطلاعات پایه</CardTitle>
                        <CardDescription>
                            نام و توضیحات کلاس را وارد کنید
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">نام کلاس</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="مثال: ریاضی پایه دهم"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">توضیحات (اختیاری)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="توضیحات درباره کلاس..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>برنامه جلسات</CardTitle>
                        <CardDescription>
                            جلسات برنامه‌ریزی شده کلاس را تعریف کنید
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Tabs */}
                        <div className="flex border-b border-[var(--border)] mb-4">
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "manual"
                                    ? "border-[var(--primary-600)] text-[var(--primary-600)]"
                                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                    }`}
                                onClick={() => setActiveTab("manual")}
                            >
                                افزودن دستی
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "auto"
                                    ? "border-[var(--primary-600)] text-[var(--primary-600)]"
                                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                    }`}
                                onClick={() => setActiveTab("auto")}
                            >
                                تولید خودکار
                            </button>
                        </div>

                        {/* Add Session Form */}
                        {activeTab === "manual" && (
                            <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)] space-y-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    افزودن جلسه جدید
                                </h4>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>عنوان جلسه</Label>
                                        <Input
                                            value={newSession.title}
                                            onChange={(e) =>
                                                setNewSession({ ...newSession, title: e.target.value })
                                            }
                                            placeholder="مثال: جلسه اول"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>تاریخ</Label>
                                        <PersianDatePicker
                                            value={newSession.date || undefined}
                                            onChange={(date) =>
                                                setNewSession({ ...newSession, date })
                                            }
                                            minDate={new Date()}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ساعت</Label>
                                        <Input
                                            type="time"
                                            value={newSession.time}
                                            onChange={(e) =>
                                                setNewSession({ ...newSession, time: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>توضیحات (اختیاری)</Label>
                                    <Input
                                        value={newSession.description}
                                        onChange={(e) =>
                                            setNewSession({ ...newSession, description: e.target.value })
                                        }
                                        placeholder="توضیحات جلسه..."
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleAddSession}
                                    disabled={!newSession.title || !newSession.date}
                                    className="w-full"
                                >
                                    افزودن به لیست
                                </Button>
                            </div>
                        )}

                        {/* Auto Generation Form */}
                        {activeTab === "auto" && (
                            <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)] space-y-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    تولید خودکار جلسات
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>تاریخ شروع</Label>
                                        <PersianDatePicker
                                            value={generationConfig.startDate || undefined}
                                            onChange={(date) =>
                                                setGenerationConfig({ ...generationConfig, startDate: date })
                                            }
                                            minDate={new Date()}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ساعت برگزاری</Label>
                                        <Input
                                            type="time"
                                            value={generationConfig.startTime}
                                            onChange={(e) =>
                                                setGenerationConfig({ ...generationConfig, startTime: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>تعداد جلسات</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={generationConfig.count}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setGenerationConfig({ ...generationConfig, count: parseInt(e.target.value) || 0 })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>روزهای برگزاری</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: "شنبه", value: 6 },
                                            { label: "یکشنبه", value: 0 },
                                            { label: "دوشنبه", value: 1 },
                                            { label: "سه‌شنبه", value: 2 },
                                            { label: "چهارشنبه", value: 3 },
                                            { label: "پنج‌شنبه", value: 4 },
                                            { label: "جمعه", value: 5 },
                                        ].map((day) => (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => toggleDay(day.value)}
                                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${generationConfig.days.includes(day.value)
                                                    ? "bg-[var(--primary-600)] text-white border-[var(--primary-600)]"
                                                    : "bg-white text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleGenerateSessions}
                                    disabled={!generationConfig.startDate || generationConfig.days.length === 0}
                                    className="w-full"
                                >
                                    تولید جلسات
                                </Button>
                            </div>
                        )}

                        {/* Scheduled Sessions List */}
                        {scheduledSessions.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm text-[var(--muted-foreground)]">
                                    جلسات تعریف شده ({scheduledSessions.length})
                                </h4>
                                <div className="space-y-2">
                                    {scheduledSessions
                                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                                        .map((session, index) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between p-3 bg-white border border-[var(--border)] rounded-md"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{session.title}</p>
                                                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                                            <CalendarIcon className="h-3 w-3" />
                                                            <span>{toJalali(session.date)} ساعت {moment(session.date).format("HH:mm")}</span>
                                                            {session.description && (
                                                                <span>- {session.description}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveSession(session.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                    <Button type="submit" disabled={loading}>
                        {loading ? "در حال ایجاد..." : "ایجاد کلاس"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
