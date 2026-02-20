"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GraduationCap, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";

interface ClassData {
    id: string;
    name: string;
    description: string | null;
    teachers: { id: string; name: string }[];
    studentCount: number;
    createdAt: string;
}

export default function ClassesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchClasses();
    }, [session, router]);

    const fetchClasses = async () => {
        try {
            const response = await fetch("/api/classes");
            const data = await response.json();
            if (response.ok) {
                setClasses(data.classes || []);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
        } finally {
            setLoading(false);
        }
    };

    if (session?.user?.role !== "ADMIN") {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="کلاس‌ها" />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                        کلاس‌ها
                    </h1>
                    <p className="text-[var(--muted-foreground)]">
                        مشاهده و مدیریت کلاس‌های آموزشی
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                    </div>
                ) : classes.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <p className="text-center text-[var(--muted-foreground)]">
                                هیچ کلاسی یافت نشد
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {classes.map((cls) => (
                            <Link key={cls.id} href={`/dashboard/admin/classes/${cls.id}`}>
                                <Card className="hover:shadow-lg transition-all h-full cursor-pointer">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <GraduationCap className="h-5 w-5 text-[var(--primary-600)]" />
                                            {cls.name}
                                        </CardTitle>
                                        {cls.description && (
                                            <CardDescription className="line-clamp-2">
                                                {cls.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <GraduationCap className="h-4 w-4 text-[var(--muted-foreground)]" />
                                                <span className="text-[var(--muted-foreground)]">
                                                    {cls.teachers.map(t => t.name).join("، ") || "بدون معلم"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                                                <span className="text-[var(--muted-foreground)]">
                                                    {cls.studentCount} دانش‌آموز
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t border-[var(--border)]">
                                                <span className="text-xs text-[var(--muted-foreground)]">
                                                    ایجاد شده: {new Date(cls.createdAt).toLocaleDateString("fa-IR")}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
