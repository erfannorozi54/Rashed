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

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                        داشبورد مدیریت
                    </h1>
                    <p className="text-[var(--muted-foreground)]">
                        مشاهده و مدیریت کاربران، کلاسها و جلسات
                    </p>
                </div>

                {/* Navigation Cards + Calendar */}
                <div className="grid gap-6 lg:grid-cols-4 mb-8">
                    <div className="lg:col-span-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Link href="/dashboard/admin/students">
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-[var(--primary-600)]" />
                                        دانشآموزان
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[var(--primary-600)]">
                                        {users.filter(u => u.role === "STUDENT").length}
                                    </div>
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                        دانشآموز ثبتنام شده
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/admin/teachers">
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <GraduationCap className="h-4 w-4 text-[var(--secondary-600)]" />
                                        معلمان
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[var(--secondary-600)]">
                                        {users.filter(u => u.role === "TEACHER").length}
                                    </div>
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                        معلم فعال
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/admin/classes">
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <GraduationCap className="h-4 w-4 text-green-600" />
                                        کلاسها
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {classCount}
                                    </div>
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                        کلاس فعال
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/admin/refunds">
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <RefreshCw className="h-4 w-4 text-amber-600" />
                                        استردادها
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-[var(--muted-foreground)]">مشاهده و بررسی</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    {/* Mini Calendar */}
                    <MiniCalendar
                        sessions={sessions}
                        onMonthChange={handleMonthChange}
                        className="h-fit"
                    />
                </div>

                {/* All Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            همه کاربران ({users.length})
                        </CardTitle>
                        <CardDescription>
                            تمامی کاربران ثبتنام شده در سیستم
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                            </div>
                        ) : users.length === 0 ? (
                            <p className="text-center text-[var(--muted-foreground)] py-8">
                                هیچ کاربری یافت نشد
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="text-right p-3 text-sm font-semibold">نام</th>
                                            <th className="text-right p-3 text-sm font-semibold">شماره تلفن</th>
                                            <th className="text-right p-3 text-sm font-semibold">نقش</th>
                                            <th className="text-right p-3 text-sm font-semibold">تاریخ ثبتنام</th>
                                            <th className="text-right p-3 text-sm font-semibold">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                                                <td className="p-3">
                                                    <Link href={`/dashboard/admin/users/${user.id}`} className="text-sm hover:text-[var(--primary-600)]">
                                                        {user.name}
                                                    </Link>
                                                </td>
                                                <td className="p-3 text-sm font-mono">{user.phone}</td>
                                                <td className="p-3 text-sm">
                                                    <span
                                                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${user.role === "ADMIN"
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
                                                                : "دانشآموز"}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-sm">
                                                    {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        className="text-sm rounded border border-[var(--border)] px-2 py-1"
                                                    >
                                                        <option value="STUDENT">دانشآموز</option>
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
            </main>
        </div>
    );
}
