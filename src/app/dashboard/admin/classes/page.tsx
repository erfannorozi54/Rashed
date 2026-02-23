"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Users, Plus, Globe, Key, Lock } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { cn } from "@/lib/utils";

type ClassType = "PUBLIC" | "SEMI_PRIVATE" | "PRIVATE";

interface ClassData {
    id: string;
    name: string;
    description: string | null;
    classType: ClassType;
    maxCapacity: number | null;
    sessionDuration: number;
    teachers: { id: string; name: string }[];
    studentCount: number;
    createdAt: string;
}

const CLASS_TYPE_CONFIG: Record<ClassType, { label: string; icon: React.ReactNode; className: string }> = {
    PUBLIC: {
        label: "عمومی",
        icon: <Globe className="h-3 w-3" />,
        className: "bg-green-100 text-green-700 border-green-200",
    },
    SEMI_PRIVATE: {
        label: "نیمه خصوصی",
        icon: <Key className="h-3 w-3" />,
        className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    PRIVATE: {
        label: "خصوصی",
        icon: <Lock className="h-3 w-3" />,
        className: "bg-red-100 text-red-700 border-red-200",
    },
};

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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                            کلاس‌ها
                        </h1>
                        <p className="text-[var(--muted-foreground)]">
                            مشاهده و مدیریت کلاس‌های آموزشی
                        </p>
                    </div>
                    <Link href="/dashboard/admin/classes/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            ایجاد کلاس جدید
                        </Button>
                    </Link>
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
                        {classes.map((cls) => {
                            const typeConfig = CLASS_TYPE_CONFIG[cls.classType] ?? CLASS_TYPE_CONFIG.PUBLIC;
                            return (
                                <Link key={cls.id} href={`/dashboard/admin/classes/${cls.id}`}>
                                    <Card className="hover:shadow-lg transition-all h-full cursor-pointer">
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="flex items-center gap-2 flex-1 min-w-0">
                                                    <GraduationCap className="h-5 w-5 text-[var(--primary-600)] shrink-0" />
                                                    <span className="truncate">{cls.name}</span>
                                                </CardTitle>
                                                <span
                                                    className={cn(
                                                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shrink-0",
                                                        typeConfig.className
                                                    )}
                                                >
                                                    {typeConfig.icon}
                                                    {typeConfig.label}
                                                </span>
                                            </div>
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
                                                        {cls.teachers.map((t) => t.name).join("، ") || "بدون معلم"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                                                    <span className="text-[var(--muted-foreground)]">
                                                        {cls.studentCount} دانش‌آموز
                                                        {cls.maxCapacity && ` / ${cls.maxCapacity} ظرفیت`}
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
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
