"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";

interface Admin {
    id: string;
    name: string;
    phone: string;
    createdAt: string;
}

export default function AdminsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchAdmins();
    }, [session, router]);

    const fetchAdmins = async () => {
        try {
            const response = await fetch("/api/users?role=ADMIN");
            const data = await response.json();
            if (response.ok) {
                setAdmins(data.users || []);
            }
        } catch (error) {
            console.error("Error fetching admins:", error);
        } finally {
            setLoading(false);
        }
    };

    if (session?.user?.role !== "ADMIN") {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="مدیران" />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                        مدیران
                    </h1>
                    <p className="text-[var(--muted-foreground)]">
                        مشاهده لیست مدیران سیستم
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-red-600" />
                            لیست مدیران ({admins.length})
                        </CardTitle>
                        <CardDescription>
                            تمامی مدیران سیستم
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                            </div>
                        ) : admins.length === 0 ? (
                            <p className="text-center text-[var(--muted-foreground)] py-8">
                                هیچ مدیری یافت نشد
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
                                        {admins.map((admin) => (
                                            <tr key={admin.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                                                <td className="p-3 text-sm">
                                                    {admin.name}
                                                </td>
                                                <td className="p-3 text-sm font-mono">{admin.phone}</td>
                                                <td className="p-3 text-sm">
                                                    {new Date(admin.createdAt).toLocaleDateString("fa-IR")}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    <Link
                                                        href={`/dashboard/admin/users/${admin.id}`}
                                                        className="text-[var(--primary-600)] hover:underline flex items-center gap-1"
                                                    >
                                                        <TrendingUp className="h-4 w-4" />
                                                        مشاهده جزئیات
                                                    </Link>
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
