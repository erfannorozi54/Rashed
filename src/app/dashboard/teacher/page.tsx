"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Users, FileText, LogOut, GraduationCap, PlusCircle, Clock } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";


interface User {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    phone: string;
    role: string;
}

export default function TeacherDashboard() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
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


    // ... inside component
    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="پنل معلم" />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                            داشبورد معلم
                        </h1>
                        <p className="text-[var(--muted-foreground)]">
                            مدیریت کلاس‌ها و دانش‌آموزان
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/teacher/create-blog">
                            <Button>
                                <PlusCircle className="h-4 w-4 ml-2" />
                                ایجاد بلاگ
                            </Button>
                        </Link>
                        <Button variant="outline">
                            <PlusCircle className="h-4 w-4 ml-2" />
                            ایجاد کلاس
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Link href="/dashboard/teacher/classes">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">کلاس‌های من</CardTitle>
                                <BookOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                    کلیک کنید برای مشاهده
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/teacher/availability">
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">زمان آزاد</CardTitle>
                                <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">-</div>
                                <p className="text-xs text-[var(--muted-foreground)]">مدیریت زمان آزاد</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">دانش‌آموزان</CardTitle>
                            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users.filter(u => u.role === 'STUDENT').length}</div>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                دانش‌آموز ثبت‌نام شده
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">بلاگ‌ها</CardTitle>
                            <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                بلاگ منتشر شده
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Users List */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            لیست کاربران ({users.length})
                        </CardTitle>
                        <CardDescription>
                            تمامی کاربران ثبت‌نام شده در سیستم
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {usersLoading ? (
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                                                <td className="p-3 text-sm">{user.name}</td>
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
                                                                : "دانش‌آموز"}
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

                {/* Classes Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>کلاس‌های من</CardTitle>
                        <CardDescription>
                            لیست کلاس‌هایی که تدریس می‌کنید
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-[var(--muted-foreground)]">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>هنوز کلاسی ایجاد نکرده‌اید</p>
                            <Button variant="outline" className="mt-4">
                                <PlusCircle className="h-4 w-4 ml-2" />
                                ایجاد اولین کلاس
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Blogs Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>بلاگ‌های من</CardTitle>
                        <CardDescription>
                            بلاگ‌هایی که نوشته‌اید
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-[var(--muted-foreground)]">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>هنوز بلاگی ننوشته‌اید</p>
                            <Link href="/dashboard/teacher/create-blog">
                                <Button variant="outline" className="mt-4">
                                    <PlusCircle className="h-4 w-4 ml-2" />
                                    نوشتن اولین بلاگ
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
