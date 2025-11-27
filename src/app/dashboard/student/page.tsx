"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Calendar, FileText, LogOut, GraduationCap } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";


export default function StudentDashboard() {
    const { data: session } = useSession();


    // ... inside component
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
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">کلاس‌های من</CardTitle>
                            <BookOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
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
                            <div className="text-2xl font-bold">0</div>
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
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                جلسه این هفته
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Classes Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>کلاس‌های من</CardTitle>
                        <CardDescription>
                            لیست کلاس‌هایی که در آن‌ها ثبت‌نام کرده‌اید
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-[var(--muted-foreground)]">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>هنوز در هیچ کلاسی ثبت‌نام نکرده‌اید</p>
                            <p className="text-sm mt-2">
                                برای ثبت‌نام در کلاس‌ها با مدیر موسسه تماس بگیرید
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
