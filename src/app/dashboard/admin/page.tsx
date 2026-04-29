"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GraduationCap, Users, RefreshCw, Clock, BookMarked } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MiniCalendar from "@/components/ui/MiniCalendar";
import DashboardQuickCard from "@/components/ui/DashboardQuickCard";
import { toJalali } from "@/lib/jalali-utils";

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
    createdAt: string;
}

export default function AdminDashboard() {
    const { data: session } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [classCount, setClassCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<Session[]>([]);

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchUsers();
        fetchClassCount();
        fetchSessions();
    }, [session, router]);

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/users");
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClassCount = async () => {
        try {
            const response = await fetch("/api/classes");
            const data = await response.json();
            if (response.ok) {
                setClassCount(data.classes?.length || 0);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
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

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const response = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, newRole }),
            });

            if (response.ok) {
                fetchUsers();
                alert("نقش کاربر با موفقیت تغییر کرد");
            } else {
                alert("خطا در تغییر نقش");
            }
        } catch (error) {
            console.error("Error changing role:", error);
            alert("خطا در تغییر نقش");
        }
    };

    if (session?.user?.role !== "ADMIN") {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="پنل مدیریت" />

            <main className="container mx-auto px-4 py-6 lg:py-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
                    <section className="space-y-6">
                        <Card className="rounded-2xl sm:rounded-3xl border-none bg-gradient-to-l from-[var(--primary-600)] via-[var(--primary-700)] to-[var(--secondary-700)] text-white shadow-lg">
                            <CardContent className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <p className="text-xs sm:text-sm text-white/80">نمای کلی امروز</p>
                                        <h1 className="text-xl sm:text-2xl font-bold lg:text-3xl">داشبورد مدیریت</h1>
                                        <p className="max-w-2xl text-xs sm:text-sm leading-5 sm:leading-6 text-white/80">
                                            مدیریت کاربران، کلاس ها و وضعیت جلسات از یک نمای فشرده و سریع.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="rounded-full bg-white/15 px-2.5 sm:px-3 py-1 sm:py-1.5">
                                            {users.filter((user) => user.role === "STUDENT").length} دانش آموز
                                        </span>
                                        <span className="rounded-full bg-white/15 px-2.5 sm:px-3 py-1 sm:py-1.5">
                                            {users.filter((user) => user.role === "TEACHER").length} معلم
                                        </span>
                                        <span className="rounded-full bg-white/15 px-2.5 sm:px-3 py-1 sm:py-1.5">{classCount} کلاس فعال</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    <Link href="/dashboard/admin/classes" className="flex-1 sm:flex-none">
                                        <Button className="w-full sm:w-auto bg-white text-[var(--primary-700)] hover:bg-white/90 text-sm">
                                            مدیریت کلاس ها
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard/admin/teachers" className="flex-1 sm:flex-none">
                                        <Button variant="outline" className="w-full sm:w-auto border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white text-sm">
                                            بررسی معلمان
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <DashboardQuickCard
                                href="/dashboard/admin/students"
                                title="دانش آموزان"
                                value={users.filter((user) => user.role === "STUDENT").length}
                                description="لیست ثبت نام ها و وضعیت حضور را سریع تر پیگیری کنید."
                                icon={Users}
                                accentClassName="text-[var(--primary-600)]"
                            />
                            <DashboardQuickCard
                                href="/dashboard/admin/teachers"
                                title="معلمان"
                                value={users.filter((user) => user.role === "TEACHER").length}
                                description="برنامه ها، تخصص ها و ظرفیت تدریس را مرور کنید."
                                icon={GraduationCap}
                                accentClassName="text-[var(--secondary-600)]"
                            />
                            <DashboardQuickCard
                                href="/dashboard/admin/classes"
                                title="کلاس ها"
                                value={classCount}
                                description="کلاس های فعال و برنامه ریزی جاری را یک جا ببینید."
                                icon={BookMarked}
                                accentClassName="text-emerald-600"
                            />
                            <DashboardQuickCard
                                href="/dashboard/admin/refunds"
                                title="استردادها"
                                description="درخواست های بازگشت وجه و بررسی های مالی را پیگیری کنید."
                                icon={RefreshCw}
                                accentClassName="text-amber-600"
                            />
                        </div>

                        <Card className="rounded-2xl sm:rounded-3xl">
                            <CardHeader className="gap-2 p-4 sm:p-5">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                                    همه کاربران ({users.length})
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">تمامی کاربران ثبت نام شده در سیستم</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--primary-600)]"></div>
                                    </div>
                                ) : users.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">هیچ کاربری یافت نشد</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[640px]">
                                            <thead>
                                                <tr className="border-y border-[var(--border)] bg-[var(--muted)]/60">
                                                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-right text-xs font-semibold text-[var(--muted-foreground)]">نام</th>
                                                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] hidden sm:table-cell">شماره تلفن</th>
                                                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-right text-xs font-semibold text-[var(--muted-foreground)]">نقش</th>
                                                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] hidden md:table-cell">تاریخ ثبت نام</th>
                                                    <th className="px-3 sm:px-5 py-2.5 sm:py-3 text-right text-xs font-semibold text-[var(--muted-foreground)]">عملیات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user) => (
                                                    <tr key={user.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]/40">
                                                        <td className="px-3 sm:px-5 py-3 sm:py-3.5">
                                                            <Link href={`/dashboard/admin/users/${user.id}`} className="text-xs sm:text-sm font-medium hover:text-[var(--primary-600)]">
                                                                {user.name}
                                                            </Link>
                                                        </td>
                                                        <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-mono hidden sm:table-cell">{user.phone}</td>
                                                        <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm">
                                                            <span
                                                                className={`inline-flex rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium ${user.role === "ADMIN"
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
                                                        <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm hidden md:table-cell">{toJalali(user.createdAt)}</td>
                                                        <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm">
                                                            <select
                                                                value={user.role}
                                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                                className="rounded-lg border border-[var(--border)] bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]"
                                                            >
                                                                <option value="STUDENT">دانش آموز</option>
                                                                <option value="TEACHER">معلم</option>
                                                                <option value="ADMIN">مدیر</option>
                                                            </select>
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
                            className="h-fit rounded-2xl sm:rounded-3xl"
                        />

                        <Card className="rounded-2xl sm:rounded-3xl">
                            <CardHeader className="p-4 sm:p-5 pb-3">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                                    پیگیری سریع
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">چند مسیر پرکاربرد برای مدیریت روزانه</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-5 pt-0">
                                <Link href="/dashboard/admin/students" className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-[var(--muted)] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-colors hover:bg-[var(--muted)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:ring-offset-2">
                                    <span>بررسی دانش آموزان و ثبت نام ها</span>
                                    <span className="font-semibold text-[var(--primary-600)]">مشاهده</span>
                                </Link>
                                <Link href="/dashboard/admin/teachers" className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-[var(--muted)] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-colors hover:bg-[var(--muted)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:ring-offset-2">
                                    <span>تنظیم وضعیت اساتید و تخصص ها</span>
                                    <span className="font-semibold text-[var(--primary-600)]">مشاهده</span>
                                </Link>
                                <Link href="/dashboard/admin/refunds" className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-[var(--muted)] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-colors hover:bg-[var(--muted)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:ring-offset-2">
                                    <span>رسیدگی به درخواست های استرداد</span>
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
