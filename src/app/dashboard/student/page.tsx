"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Calendar, FileText, CreditCard, UserCheck, Clock } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardQuickCard from "@/components/ui/DashboardQuickCard";
import { SessionTypeBadge } from "@/components/SessionTypeBadge";
import { formatTime } from "@/lib/jalali-utils";

export default function StudentDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({
        activeClasses: 0,
        pendingAssignments: 0,
        weeklySessions: 0,
    });
    const [upcomingItems, setUpcomingItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [outstandingDebt, setOutstandingDebt] = useState(0);

    useEffect(() => {
        if (session?.user?.role === "STUDENT") {
            fetchDashboardData();
        }
    }, [session]);

    const fetchDashboardData = async () => {
        try {
            const [sessionsRes, classesRes, assignmentsRes] = await Promise.all([
                fetch("/api/sessions?type=upcoming"),
                fetch("/api/classes"),
                fetch("/api/assignments?status=pending"),
            ]);

            const sessionsData = sessionsRes.ok ? await sessionsRes.json() : { sessions: [] };
            const classesData = classesRes.ok ? await classesRes.json() : { classes: [] };
            const assignmentsData = assignmentsRes.ok ? await assignmentsRes.json() : { assignments: [] };

            const now = new Date();
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(now.getDate() + 7);

            const merged = (sessionsData.sessions || [])
                .map((s: any) => ({
                    ...s,
                    kind: s.class?.classType === "PRIVATE" ? "private" : "session",
                    sortDate: new Date(s.date),
                }))
                .sort((a: any, b: any) => a.sortDate.getTime() - b.sortDate.getTime());

            setUpcomingItems(merged);

            const weeklyCount = merged.filter((item: { sortDate: Date }) => {
                return item.sortDate >= now && item.sortDate <= oneWeekFromNow;
            }).length;

            const activeClassesCount = (classesData.classes || []).filter((cls: any) => {
                if (!cls.allSessions || cls.allSessions.length === 0) return false;
                const now = new Date();
                return cls.allSessions.some((s: any) => new Date(s.date) >= now);
            }).length;

            setStats({
                activeClasses: activeClassesCount,
                pendingAssignments: assignmentsData.assignments?.length || 0,
                weeklySessions: weeklyCount,
            });

            const paymentsRes = await fetch("/api/payments");
            if (paymentsRes.ok) {
                const paymentsData = await paymentsRes.json();
                const debt = (paymentsData.payments || [])
                    .filter((p: any) => p.status === "PENDING" || p.status === "FAILED")
                    .reduce((sum: number, p: any) => sum + p.amount, 0);
                setOutstandingDebt(debt);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="پنل دانشآموز" />

            <main className="container mx-auto px-4 py-6 lg:py-8">
                <div className="space-y-6">
                    <Card className="rounded-3xl border-none bg-gradient-to-l from-emerald-600 via-emerald-700 to-blue-700 text-white shadow-lg">
                        <CardContent className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <p className="text-sm text-white/80">نمای کلی امروز</p>
                                    <h1 className="text-2xl font-bold sm:text-3xl">داشبورد دانشآموز</h1>
                                    <p className="max-w-2xl text-sm leading-6 text-white/80">
                                        به پنل کاربری خود خوش آمدید. کلاسها، تکالیف و جلسات خود را مدیریت کنید.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full bg-white/15 px-3 py-1.5">
                                        {stats.activeClasses} کلاس فعال
                                    </span>
                                    <span className="rounded-full bg-white/15 px-3 py-1.5">
                                        {stats.weeklySessions} جلسه این هفته
                                    </span>
                                    {outstandingDebt > 0 && (
                                        <span className="rounded-full bg-amber-500/30 px-3 py-1.5">
                                            {outstandingDebt.toLocaleString("fa-IR")} تومان بدهی
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link href="/dashboard/student/classes">
                                    <Button className="bg-white text-emerald-700 hover:bg-white/90">
                                        کلاسهای من
                                    </Button>
                                </Link>
                                <Link href="/dashboard/student/book-session">
                                    <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                                        رزرو جلسه خصوصی
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <DashboardQuickCard
                            href="/dashboard/student/classes"
                            title="کلاسهای من"
                            value={stats.activeClasses}
                            description="کلاسهای فعال و جلسات آینده را مشاهده کنید."
                            icon={BookOpen}
                            accentClassName="text-emerald-600"
                        />
                        <DashboardQuickCard
                            href="/dashboard/student/schedule"
                            title="تقویم"
                            value={stats.weeklySessions}
                            description="جلسات هفته جاری و برنامه زمانبندی."
                            icon={Calendar}
                            accentClassName="text-blue-600"
                        />
                        <DashboardQuickCard
                            title="تکالیف"
                            value={stats.pendingAssignments}
                            description="تکالیف در انتظار ارسال و بررسی."
                            icon={FileText}
                            accentClassName="text-purple-600"
                        />
                        <DashboardQuickCard
                            href="/dashboard/student/account"
                            title="حساب من"
                            value={outstandingDebt > 0 ? `${outstandingDebt.toLocaleString("fa-IR")} تومان` : "بدون بدهی"}
                            description="وضعیت مالی و پرداختهای شما."
                            icon={CreditCard}
                            accentClassName={outstandingDebt > 0 ? "text-amber-600" : "text-green-600"}
                        />
                    </div>

                    <Card className="rounded-3xl">
                        <CardHeader className="gap-2 p-5">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calendar className="h-5 w-5" />
                                جلسات پیشرو
                            </CardTitle>
                            <CardDescription>برنامه کلاسهای آینده شما</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="py-8 text-center">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600"></div>
                                </div>
                            ) : upcomingItems.length === 0 ? (
                                <p className="py-8 text-center text-[var(--muted-foreground)]">
                                    هیچ جلسهای برای آینده برنامهریزی نشده است
                                </p>
                            ) : (
                                <div className="space-y-0">
                                    {upcomingItems.slice(0, 5).map((item: any, index: number) => {
                                        const isPrivate = item.kind === "private";
                                        const sessionDate = new Date(item.date);
                                        const startTime = formatTime(sessionDate);
                                        const endDate = new Date(sessionDate.getTime() + (item.class?.sessionDuration ?? 90) * 60_000);
                                        const endTime = formatTime(endDate);

                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-[var(--muted)]/40 ${
                                                    index !== upcomingItems.length - 1 ? "border-b border-[var(--border)]" : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                                                        isPrivate ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                                                    }`}>
                                                        <span className="text-xs font-bold">
                                                            {sessionDate.toLocaleDateString('fa-IR', { month: 'short' })}
                                                        </span>
                                                        <span className="text-lg font-bold">
                                                            {sessionDate.toLocaleDateString('fa-IR', { day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-medium truncate">
                                                                {isPrivate ? (item.class?.name ?? "کلاس خصوصی") : item.title}
                                                            </h4>
                                                            {isPrivate ? (
                                                                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                                    خصوصی
                                                                </span>
                                                            ) : (
                                                                <SessionTypeBadge type={item.type} />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                                            {!isPrivate && (
                                                                <>
                                                                    <BookOpen className="h-3 w-3" />
                                                                    <span className="truncate">{item.class.name}</span>
                                                                    <span>•</span>
                                                                </>
                                                            )}
                                                            <Clock className="h-3 w-3" />
                                                            <span>{startTime} - {endTime}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link href={`/dashboard/student/classes/${item.class?.id || item.classId}`}>
                                                    <Button variant="outline" size="sm" className="shrink-0">
                                                        جزئیات
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="h-5 w-5" />
                                دسترسی سریع
                            </CardTitle>
                            <CardDescription>مسیرهای پرکاربرد برای مدیریت روزانه</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 p-5 pt-0">
                            <Link href="/dashboard/student/schedule" className="flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm transition-colors hover:bg-[var(--muted)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
                                <span>مشاهده تقویم کامل جلسات</span>
                                <span className="font-semibold text-emerald-600">مشاهده</span>
                            </Link>
                            <Link href="/dashboard/student/book-session" className="flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm transition-colors hover:bg-[var(--muted)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
                                <span>رزرو جلسه خصوصی با استاد</span>
                                <span className="font-semibold text-emerald-600">مشاهده</span>
                            </Link>
                            <Link href="/dashboard/student/account" className="flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm transition-colors hover:bg-[var(--muted)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
                                <span>مدیریت حساب و پرداختها</span>
                                <span className="font-semibold text-emerald-600">مشاهده</span>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
