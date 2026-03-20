"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Calendar, Clock, X, BookOpen, ChevronLeft, Search } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { cn } from "@/lib/utils";

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

// Deterministic gradient per teacher based on name
const GRADIENTS = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-600",
];

function getGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function getInitials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
}

function TeacherCard({
    teacher,
    isAvailable,
    showAvailability,
}: {
    teacher: Teacher;
    isAvailable: boolean | undefined;
    showAvailability: boolean;
}) {
    const gradient = getGradient(teacher.name);
    const initials = getInitials(teacher.name);
    const specs = teacher.specializations;
    const prices = specs.filter((s) => s.price > 0).map((s) => s.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    const priceLabel =
        prices.length === 0
            ? "رایگان"
            : minPrice === maxPrice
            ? `${minPrice.toLocaleString("fa-IR")} تومان`
            : `${minPrice.toLocaleString("fa-IR")} – ${maxPrice.toLocaleString("fa-IR")} تومان`;

    return (
        <Link href={`/dashboard/student/book-session/${teacher.id}`} className="group block">
            <div className="relative bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">

                {/* Top gradient bar */}
                <div className={cn("h-1.5 w-full bg-gradient-to-r", gradient)} />

                {/* Availability ribbon */}
                {showAvailability && isAvailable && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                        </span>
                        وقت آزاد دارد
                    </div>
                )}

                <div className="p-5 flex flex-col flex-1 gap-4">
                    {/* Avatar + name row */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 bg-gradient-to-br shadow-md",
                            gradient
                        )}>
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-[var(--foreground)] text-base leading-tight truncate">
                                {teacher.name}
                            </h3>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3 text-[var(--muted-foreground)]" />
                                <span className="text-xs text-[var(--muted-foreground)]">جلسه ۹۰ دقیقه‌ای</span>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[var(--border)]" />

                    {/* Specializations */}
                    <div className="flex-1">
                        {specs.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {specs.slice(0, 4).map((s) => (
                                    <span
                                        key={s.id}
                                        className="inline-flex items-center gap-1 text-xs bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] rounded-lg px-2 py-1 font-medium"
                                    >
                                        <BookOpen className="h-2.5 w-2.5 text-[var(--primary-600)] shrink-0" />
                                        {s.content}
                                    </span>
                                ))}
                                {specs.length > 4 && (
                                    <span className="inline-flex items-center text-xs text-[var(--muted-foreground)] px-2 py-1">
                                        +{specs.length - 4} بیشتر
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--muted-foreground)] italic">تخصصی ثبت نشده</p>
                        )}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <div>
                            <p className="text-[10px] text-[var(--muted-foreground)] mb-0.5">هزینه جلسه</p>
                            <p className="text-sm font-bold text-[var(--primary-700)]">{priceLabel}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--primary-600)] font-semibold text-sm group-hover:gap-2 transition-all">
                            رزرو جلسه
                            <ChevronLeft className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function BookSessionPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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

    const allContents = useMemo(() => {
        const set = new Set<string>();
        teachers.forEach((t) => t.specializations.forEach((s) => set.add(s.content)));
        return Array.from(set).sort();
    }, [teachers]);

    const filteredTeachers = useMemo(() => {
        return teachers.filter((t) => {
            if (search && !t.name.includes(search) && !t.specializations.some((s) => s.content.includes(search) || s.subject.includes(search))) {
                return false;
            }
            if (selectedContent && !t.specializations.some((s) => s.content === selectedContent)) {
                return false;
            }
            if (selectedDate && Object.keys(teacherFreeMap).length > 0 && !teacherFreeMap[t.id]) {
                return false;
            }
            return true;
        });
    }, [teachers, search, selectedContent, selectedDate, teacherFreeMap]);

    const clearFilters = () => {
        setSearch("");
        setSelectedContent("");
        setSelectedDate(null);
        setTeacherFreeMap({});
    };

    const hasFilters = search || selectedContent || selectedDate;

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="رزرو جلسه خصوصی" backHref="/dashboard/student" />

            {/* Hero header */}
            <div className="bg-gradient-to-l from-[var(--primary-700)] to-[var(--primary-600)] text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center gap-3 mb-1">
                        <GraduationCap className="h-7 w-7 opacity-80" />
                        <h1 className="text-2xl font-bold">رزرو جلسه خصوصی</h1>
                    </div>
                    <p className="text-sm opacity-75 mr-10">
                        با اساتید مجرب آموزشگاه جلسه ۹۰ دقیقه‌ای رزرو کنید
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 py-6">
                {/* Filter bar */}
                <div className="bg-white border border-[var(--border)] rounded-2xl p-4 mb-6 shadow-sm space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                            <input
                                type="text"
                                placeholder="جستجو در نام استاد یا موضوع..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] pr-9 pl-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]"
                                dir="rtl"
                            />
                        </div>

                        {/* Specialization filter */}
                        <div className="relative">
                            <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                            <select
                                value={selectedContent}
                                onChange={(e) => setSelectedContent(e.target.value)}
                                className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] pr-9 pl-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] appearance-none"
                            >
                                <option value="">همه موضوعات تدریس</option>
                                {allContents.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date filter */}
                        <PersianDatePicker
                            value={selectedDate ?? undefined}
                            onChange={setSelectedDate}
                            placeholder="فیلتر بر اساس تاریخ"
                        />
                    </div>

                    {hasFilters && (
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-[var(--muted-foreground)]">
                                {filteredTeachers.length} استاد یافت شد
                            </span>
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-[var(--muted-foreground)] h-7 text-xs">
                                <X className="h-3 w-3" />
                                پاک‌کردن فیلترها
                            </Button>
                        </div>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-[var(--border)] h-60 animate-pulse" />
                        ))}
                    </div>
                ) : checkingAvailability ? (
                    <div className="flex flex-col items-center py-16 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                        <p className="text-sm text-[var(--muted-foreground)]">در حال بررسی اوقات آزاد اساتید...</p>
                    </div>
                ) : filteredTeachers.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="h-8 w-8 text-[var(--muted-foreground)] opacity-50" />
                        </div>
                        <p className="font-medium text-[var(--foreground)] mb-1">
                            {hasFilters ? "استادی با این مشخصات یافت نشد" : "هیچ استادی یافت نشد"}
                        </p>
                        {hasFilters && (
                            <button onClick={clearFilters} className="text-sm text-[var(--primary-600)] mt-2 underline underline-offset-2">
                                پاک کردن فیلترها
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredTeachers.map((t) => (
                            <TeacherCard
                                key={t.id}
                                teacher={t}
                                isAvailable={teacherFreeMap[t.id]}
                                showAvailability={!!selectedDate && Object.keys(teacherFreeMap).length > 0}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
