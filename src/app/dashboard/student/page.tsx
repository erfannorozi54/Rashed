"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Calendar, FileText, LogOut, GraduationCap, ChevronLeft, CreditCard, UserCheck, User } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { SessionTypeBadge } from "@/components/SessionTypeBadge";


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
            // Fetch upcoming sessions and classes in parallel
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

            const weeklyCount = merged.filter((item) => {
                return item.sortDate >= now && item.sortDate <= oneWeekFromNow;
            }).length;

            setStats({
                activeClasses: classesData.classes?.length || 0,
                pendingAssignments: assignmentsData.assignments?.length || 0,
                weeklySessions: weeklyCount,
            });

            // Fetch outstanding debt
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
            <DashboardHeader title="پنل دانش‌آموز" />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                        داشبورد دانش‌آموز
                    </h1>
                    <p className="text-[var(--muted-foreground)]">
                        به پنل کاربری خود خوش آمدید
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">کلاس‌های من</CardTitle>
                            <BookOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeClasses}</div>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                کلاس فعال
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">تکالیف</CardTitle>
                            <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                تکلیف در انتظار
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">جلسات</CardTitle>
                            <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.weeklySessions}</div>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                جلسه در ۷ روز آینده
                            </p>
                        </CardContent>
                    </Card>

                    <Link href="/dashboard/student/account">
                    <Card className={outstandingDebt > 0 ? "hover:shadow-lg transition-shadow cursor-pointer border-amber-200 bg-amber-50" : "hover:shadow-lg transition-shadow cursor-pointer"}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">حساب من</CardTitle>
                            <CreditCard className={`h-4 w-4 ${outstandingDebt > 0 ? "text-amber-600" : "text-[var(--muted-foreground)]"}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${outstandingDebt > 0 ? "text-amber-700" : ""}`}>
                                {outstandingDebt > 0 ? outstandingDebt.toLocaleString("fa-IR") : "۰"}
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)]">تومان بدهی</p>
                        </CardContent>
                    </Card>
                    </Link>                </div>

                {/* Navigation Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                    <Link href="/dashboard/student/teachers">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">اساتید</CardTitle>
                                <GraduationCap className="h-4 w-4 text-[var(--muted-foreground)]" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-[var(--muted-foreground)]">مشاهده برنامه هفتگی اساتید</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/student/classes">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">کلاس‌های من</CardTitle>
                                <BookOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-[var(--muted-foreground)]">مشاهده کلاس‌ها و جلسات</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/student/schedule">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">تقویم</CardTitle>
                                <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-[var(--muted-foreground)]">مشاهده تقویم کامل جلسات</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/student/book-session">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">رزرو جلسه خصوصی</CardTitle>
                                <UserCheck className="h-4 w-4 text-[var(--muted-foreground)]" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-[var(--muted-foreground)]">رزرو جلسه ۹۰ دقیقه‌ای با استاد</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Upcoming Sessions Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>جلسات پیش‌رو</CardTitle>
                            <CardDescription>
                                برنامه کلاس‌های آینده شما
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                                </div>
                            ) : upcomingItems.length === 0 ? (
                                <div className="text-center py-8 text-[var(--muted-foreground)]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-[var(--primary-600)]" />
                                            جلسات پیش‌رو
                                        </h2>
                                        <Link href="/dashboard/student/schedule">
                                            <Button variant="ghost" size="sm" className="text-[var(--primary-600)]">
                                                مشاهده تقویم کامل
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>هیچ جلسه‌ای برای آینده برنامه‌ریزی نشده است</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {upcomingItems.map((item: any) => {
                                        if (item.kind === "private") {
                                            const startTime = `${String(new Date(item.date).getHours()).padStart(2, "0")}:${String(new Date(item.date).getMinutes()).padStart(2, "0")}`;
                                            const endDate = new Date(new Date(item.date).getTime() + (item.class?.sessionDuration ?? 90) * 60_000);
                                            const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between p-4 bg-white border border-purple-100 rounded-lg hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-600 flex flex-col items-center justify-center border border-purple-100 shrink-0">
                                                            <span className="text-xs font-bold">{new Date(item.date).toLocaleDateString('fa-IR', { month: 'short' })}</span>
                                                            <span className="text-lg font-bold">{new Date(item.date).toLocaleDateString('fa-IR', { day: 'numeric' })}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-bold text-[var(--foreground)]">{item.class?.name ?? "کلاس خصوصی"}</h4>
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                                    خصوصی
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                                                {item.title && <span>{item.title}</span>}
                                                                <span className="mx-1">•</span>
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{startTime} تا {endTime}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link href="/dashboard/student/classes">
                                                        <Button variant="outline" size="sm">
                                                            جزئیات
                                                        </Button>
                                                    </Link>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-4 bg-white border border-[var(--border)] rounded-lg hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex flex-col items-center justify-center border border-blue-100 shrink-0">
                                                        <span className="text-xs font-bold">{new Date(item.date).toLocaleDateString('fa-IR', { month: 'short' })}</span>
                                                        <span className="text-lg font-bold">{new Date(item.date).toLocaleDateString('fa-IR', { day: 'numeric' })}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-[var(--foreground)]">
                                                                {item.title}
                                                            </h4>
                                                            <SessionTypeBadge type={item.type} />
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                                            <BookOpen className="h-3 w-3" />
                                                            <span>{item.class.name}</span>
                                                            <span className="mx-1">•</span>
                                                            <Calendar className="h-3 w-3" />
                                                            <span>
                                                                {new Date(item.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link href={`/dashboard/student/classes/${item.class.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        مشاهده کلاس
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
