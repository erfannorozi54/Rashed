"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Users, FileText, GraduationCap, PlusCircle, Clock } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MiniCalendar from "@/components/ui/MiniCalendar";
import DashboardQuickCard from "@/components/ui/DashboardQuickCard";

interface Session {
    id: string;
    title: string;
    date: string;
    type: "SCHEDULED" | "COMPENSATORY" | "PRIVATE";
    class?: {
        id: string;
        name: string;
        sessionDuration: number;
    };
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    phone: string;
    role: string;
}

export default function TeacherDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);

    useEffect(() => {
        fetchUsers();
        fetchSessions();
    }, []);

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const response = await fetch("/api/users");
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchSessions = async (startDate?: Date, endDate?: Date) => {
        try {
            const params = new URLSearchParams();
            if (startDate && endDate) {
                params.set("startDate", startDate.toISOString());
                params.set("endDate", endDate.toISOString());
            }
            const response = await fetch(`/api/sessions?${params.toString()}`);
            const data = await response.json();
            if (response.ok) {
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    const handleMonthChange = (startDate: Date, endDate: Date) => {
        fetchSessions(startDate, endDate);
    };

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="پنل معلم" />

            <main className="container mx-auto px-4 py-6 lg:py-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
                    <section className="space-y-6">
                        <Card className="rounded-3xl border-none bg-gradient-to-l from-[var(--secondary-600)] via-[var(--secondary-700)] to-[var(--primary-700)] text-white shadow-lg">
                            <CardContent className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <p className="text-sm text-white/80">نمای کاری امروز</p>
                                        <h1 className="text-2xl font-bold sm:text-3xl">داشبورد معلم</h1>
                                        <p className="max-w-2xl text-sm leading-6 text-white/80">
                                            به جای کارت های بلند، همه مسیرهای اصلی تدریس و تولید محتوا را جمع و جور ببینید.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="rounded-full bg-white/15 px-3 py-1.5">{users.filter((user) => user.role === "STUDENT").length} دانش آموز</span>
                                        <span className="rounded-full bg-white/15 px-3 py-1.5">مدیریت کلاس ها</span>
                                        <span className="rounded-full bg-white/15 px-3 py-1.5">نوشتن بلاگ</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Link href="/dashboard/teacher/classes/create">
                                        <Button className="bg-white text-[var(--secondary-700)] hover:bg-white/90">
                                            <PlusCircle className="ml-2 h-4 w-4" />
                                            ایجاد کلاس
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard/teacher/create-blog">
                                        <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                                            <PlusCircle className="ml-2 h-4 w-4" />
                                            ایجاد بلاگ
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <DashboardQuickCard
                                href="/dashboard/teacher/classes"
                                title="کلاس های من"
                                description="وضعیت کلاس ها، جلسه ها و اطلاعات هر درس را ببینید."
                                icon={BookOpen}
                                accentClassName="text-[var(--primary-600)]"
                            />
                            <DashboardQuickCard
                                href="/dashboard/teacher/availability"
                                title="زمان آزاد"
                                description="بازه های آزاد و استثناهای زمانی را سریع تنظیم کنید."
                                icon={Clock}
                                accentClassName="text-amber-600"
                            />
                            <DashboardQuickCard
                                href="/dashboard/teacher/specializations"
                                title="تخصص های من"
                                description="درس ها، پایه ها و قیمت گذاری را یک جا مدیریت کنید."
                                icon={GraduationCap}
                                accentClassName="text-[var(--secondary-600)]"
                            />
                            <DashboardQuickCard
                                title="دانش آموزان"
                                value={users.filter((user) => user.role === "STUDENT").length}
                                description="تعداد دانش آموزهای ثبت شده در سامانه را ببینید."
                                icon={Users}
                                accentClassName="text-emerald-600"
                            />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="rounded-3xl">
                                <CardHeader className="p-5 pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BookOpen className="h-5 w-5" />
                                        کلاس های من
                                    </CardTitle>
                                    <CardDescription>نمای فشرده برای مدیریت سریع کلاس های تدریسی</CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 pt-0">
                                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40 px-5 py-8 text-center text-[var(--muted-foreground)]">
                                        <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-50" />
                                        <p className="text-sm">هنوز کلاسی ایجاد نکرده اید</p>
                                        <Link href="/dashboard/teacher/classes/create">
                                            <Button variant="outline" className="mt-4">
                                                <PlusCircle className="ml-2 h-4 w-4" />
                                                ایجاد اولین کلاس
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl">
                                <CardHeader className="p-5 pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FileText className="h-5 w-5" />
                                        بلاگ های من
                                    </CardTitle>
                                    <CardDescription>محتواهای آموزشی را بدون اشغال فضای زیاد مدیریت کنید</CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 pt-0">
                                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40 px-5 py-8 text-center text-[var(--muted-foreground)]">
                                        <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
                                        <p className="text-sm">هنوز بلاگی ننوشته اید</p>
                                        <Link href="/dashboard/teacher/create-blog">
                                            <Button variant="outline" className="mt-4">
                                                <PlusCircle className="ml-2 h-4 w-4" />
                                                نوشتن اولین بلاگ
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="rounded-3xl">
                            <CardHeader className="gap-2 p-5">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="h-5 w-5" />
                                    لیست کاربران ({users.length})
                                </CardTitle>
                                <CardDescription>نمای جمع و جور از کاربران ثبت نام شده در سیستم</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {usersLoading ? (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--primary-600)]"></div>
                                    </div>
                                ) : users.length === 0 ? (
                                    <p className="py-8 text-center text-[var(--muted-foreground)]">هیچ کاربری یافت نشد</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[640px]">
                                            <thead>
                                                <tr className="border-y border-[var(--border)] bg-[var(--muted)]/60">
                                                    <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)]">نام</th>
                                                    <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)]">شماره تلفن</th>
                                                    <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)]">نقش</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user) => (
                                                    <tr key={user.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]/40">
                                                        <td className="px-5 py-3.5 text-sm font-medium">{user.name}</td>
                                                        <td className="px-5 py-3.5 text-sm font-mono">{user.phone}</td>
                                                        <td className="px-5 py-3.5 text-sm">
                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${user.role === "ADMIN"
                                                                    ? "bg-red-100 text-red-700"
                                                                    : user.role === "TEACHER"
                                                                        ? "bg-blue-100 text-blue-700"
                                                                        : "bg-green-100 text-green-700"
                                                                    }`}
                                                            >
                                                                {user.role === "ADMIN"
                                                                    ? "مدیر"
                                                                    : user.role === "TEACHER"
                                                                        ? "معلم"
                                                                        : "دانش آموز"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <aside className="space-y-6">
                        <MiniCalendar
                            sessions={sessions}
                            onMonthChange={handleMonthChange}
                            className="h-fit rounded-3xl"
                        />

                        <Card className="rounded-3xl">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="h-5 w-5" />
                                    مسیرهای سریع
                                </CardTitle>
                                <CardDescription>چند لینک پر استفاده برای کار روزانه</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 p-5 pt-0">
                                <Link href="/dashboard/teacher/classes" className="flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm transition-colors hover:bg-[var(--muted)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:ring-offset-2">
                                    <span>مرور کلاس ها و جلسه ها</span>
                                    <span className="font-semibold text-[var(--primary-600)]">مشاهده</span>
                                </Link>
                                <Link href="/dashboard/teacher/availability" className="flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm transition-colors hover:bg-[var(--muted)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:ring-offset-2">
                                    <span>تنظیم زمان های آزاد</span>
                                    <span className="font-semibold text-[var(--primary-600)]">مشاهده</span>
                                </Link>
                                <Link href="/dashboard/teacher/specializations" className="flex items-center justify-between rounded-2xl bg-[var(--muted)] px-4 py-3 text-sm transition-colors hover:bg-[var(--muted)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:ring-offset-2">
                                    <span>به روز رسانی تخصص ها و قیمت ها</span>
                                    <span className="font-semibold text-[var(--primary-600)]">مشاهده</span>
                                </Link>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </main>
        </div>
    );
}
