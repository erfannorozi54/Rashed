"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Calendar, Clock, X } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PersianDatePicker from "@/components/ui/PersianDatePicker";

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

export default function BookSessionPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedContent, setSelectedContent] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [teacherFreeMap, setTeacherFreeMap] = useState<Record<string, boolean>>({});
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    useEffect(() => {
        fetch("/api/teachers")
            .then((r) => r.json())
            .then((d) => setTeachers(d.teachers || []))
            .finally(() => setLoading(false));
    }, []);

    // When date changes, check availability for all teachers
    useEffect(() => {
        if (!selectedDate) {
            setTeacherFreeMap({});
            return;
        }
        checkAllTeacherAvailability(selectedDate);
    }, [selectedDate, teachers]);

    const checkAllTeacherAvailability = async (date: Date) => {
        setCheckingAvailability(true);
        const dateStr = date.toISOString().split("T")[0];
        const results: Record<string, boolean> = {};

        await Promise.all(
            teachers.map(async (t) => {
                try {
                    const res = await fetch(
                        `/api/teachers/${t.id}/availability/free-slots?date=${dateStr}&duration=90`
                    );
                    const data = await res.json();
                    results[t.id] = Array.isArray(data.freeSlots) && data.freeSlots.length > 0;
                } catch {
                    results[t.id] = false;
                }
            })
        );

        setTeacherFreeMap(results);
        setCheckingAvailability(false);
    };

    // All unique content values across all teachers
    const allContents = useMemo(() => {
        const set = new Set<string>();
        teachers.forEach((t) => t.specializations.forEach((s) => set.add(s.content)));
        return Array.from(set).sort();
    }, [teachers]);

    // Filter teachers
    const filteredTeachers = useMemo(() => {
        return teachers.filter((t) => {
            if (selectedContent && !t.specializations.some((s) => s.content === selectedContent)) {
                return false;
            }
            if (selectedDate && Object.keys(teacherFreeMap).length > 0 && !teacherFreeMap[t.id]) {
                return false;
            }
            return true;
        });
    }, [teachers, selectedContent, selectedDate, teacherFreeMap]);

    const clearFilters = () => {
        setSelectedContent("");
        setSelectedDate(null);
        setTeacherFreeMap({});
    };

    const hasFilters = selectedContent || selectedDate;

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="رزرو جلسه خصوصی" backHref="/dashboard/student" />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">رزرو جلسه خصوصی</h1>
                    <p className="text-[var(--muted-foreground)]">
                        استاد مورد نظر خود را انتخاب کرده و یک جلسه ۹۰ دقیقه‌ای رزرو کنید
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white border border-[var(--border)] rounded-xl p-4 mb-6 space-y-4">
                    <h2 className="font-semibold text-sm text-[var(--foreground)]">فیلترها</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Specialization filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5" />
                                موضوع تدریس
                            </label>
                            <select
                                value={selectedContent}
                                onChange={(e) => setSelectedContent(e.target.value)}
                                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]"
                            >
                                <option value="">همه موضوعات</option>
                                {allContents.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                تاریخ (نمایش اساتید دارای وقت آزاد)
                            </label>
                            <PersianDatePicker
                                value={selectedDate ?? undefined}
                                onChange={setSelectedDate}
                                placeholder="انتخاب تاریخ"
                            />
                        </div>
                    </div>

                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-[var(--muted-foreground)]">
                            <X className="h-3.5 w-3.5" />
                            پاک‌کردن فیلترها
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                    </div>
                ) : checkingAvailability ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                        <p className="text-sm text-[var(--muted-foreground)]">در حال بررسی اوقات آزاد اساتید...</p>
                    </div>
                ) : filteredTeachers.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-[var(--muted-foreground)] opacity-50" />
                        <p className="text-[var(--muted-foreground)]">
                            {hasFilters ? "استادی با این فیلترها یافت نشد" : "هیچ استادی یافت نشد"}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredTeachers.map((t) => (
                            <Card key={t.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <GraduationCap className="h-5 w-5 text-[var(--secondary-600)] shrink-0" />
                                        {t.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col flex-1 gap-3">
                                    {t.specializations.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {t.specializations.map((s) => (
                                                <span
                                                    key={s.id}
                                                    className="inline-block text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5"
                                                >
                                                    {s.content}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[var(--muted-foreground)]">تخصصی تعریف نشده</p>
                                    )}

                                    {selectedDate && teacherFreeMap[t.id] && (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            در تاریخ انتخابی وقت آزاد دارد
                                        </p>
                                    )}

                                    <div className="mt-auto pt-2">
                                        <Link href={`/dashboard/student/book-session/${t.id}`}>
                                            <Button className="w-full" size="sm">
                                                رزرو جلسه
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
