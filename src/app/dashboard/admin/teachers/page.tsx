"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GraduationCap, TrendingUp } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";

interface Teacher {
    id: string;
    name: string;
    phone: string;
    createdAt: string;
}

export default function TeachersPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchTeachers();
    }, [session, router]);

    const fetchTeachers = async () => {
        try {
            const response = await fetch("/api/users?role=TEACHER");
            const data = await response.json();
            if (response.ok) {
                setTeachers(data.users || []);
            }
        } catch (error) {
            console.error("Error fetching teachers:", error);
        } finally {
            setLoading(false);
        }
    };

    if (session?.user?.role !== "ADMIN") {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="معلمان" />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                        معلمان
                    </h1>
                    <p className="text-[var(--muted-foreground)]">
                        مشاهده و مدیریت معلمان سیستم
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-[var(--secondary-600)]" />
                            لیست معلمان ({teachers.length})
                        </CardTitle>
                        <CardDescription>
                            تمامی معلمان ثبت‌نام شده
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                            </div>
                        ) : teachers.length === 0 ? (
                            <p className="text-center text-[var(--muted-foreground)] py-8">
                                هیچ معلمی یافت نشد
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="text-right p-3 text-sm font-semibold">نام</th>
                                            <th className="text-right p-3 text-sm font-semibold">شماره تلفن</th>
                                            <th className="text-right p-3 text-sm font-semibold">تاریخ ثبت‌نام</th>
                                            <th className="text-right p-3 text-sm font-semibold">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teachers.map((teacher) => (
                                            <tr key={teacher.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                                                <td className="p-3 text-sm">
                                                    {teacher.name}
                                                </td>
                                                <td className="p-3 text-sm font-mono">{teacher.phone}</td>
                                                <td className="p-3 text-sm">
                                                    {new Date(teacher.createdAt).toLocaleDateString("fa-IR")}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            href={`/dashboard/admin/users/${teacher.id}`}
                                                            className="text-[var(--primary-600)] hover:underline flex items-center gap-1"
                                                        >
                                                            <TrendingUp className="h-4 w-4" />
                                                            جزئیات
                                                        </Link>
                                                        <Link
                                                            href={`/dashboard/admin/teachers/${teacher.id}/availability`}
                                                            className="text-[var(--secondary-600)] hover:underline flex items-center gap-1"
                                                        >
                                                            زمان آزاد
                                                        </Link>
                                                    </div>
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
