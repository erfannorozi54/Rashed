"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Users, Plus, Globe, Key, Lock, Trash2, Pencil, CheckCircle, Calendar } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { cn } from "@/lib/utils";
import { toJalali, getPersianDayName } from "@/lib/jalali-utils";

type ClassType = "PUBLIC" | "SEMI_PRIVATE" | "PRIVATE";

interface Session {
    id: string;
    title: string;
    date: string;
}

interface ClassData {
    id: string;
    name: string;
    description: string | null;
    classType: ClassType;
    maxCapacity: number | null;
    sessionDuration: number;
    sessionPrice: number;
    teachers: { id: string; name: string }[];
    studentCount: number;
    isCompleted: boolean;
    nextSession: Session | null;
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
    const [showCompleted, setShowCompleted] = useState(false);

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

    const handleDeleteClass = async (e: React.MouseEvent, classId: string, className: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`آیا از حذف کلاس "${className}" اطمینان دارید؟ این عمل قابل بازگشت نیست.`)) return;
        try {
            const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
            if (res.ok) {
                setClasses((prev) => prev.filter((c) => c.id !== classId));
            } else {
                const data = await res.json();
                alert(data.error || "خطا در حذف کلاس");
            }
        } catch {
            alert("خطا در حذف کلاس");
        }
    };

    if (session?.user?.role !== "ADMIN") {
        return null;
    }

    const activeClasses = classes.filter((c) => !c.isCompleted);
    const completedClasses = classes.filter((c) => c.isCompleted);
    const hasContent = classes.length > 0;

    const renderClassCard = (cls: ClassData) => {
        const typeConfig = CLASS_TYPE_CONFIG[cls.classType] ?? CLASS_TYPE_CONFIG.PUBLIC;
        return (
            <Card key={cls.id} className="hover:shadow-lg transition-all h-full flex flex-col">
                <Link href={`/dashboard/admin/classes/${cls.id}`} className="flex-1">
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
                                    {cls.studentCount} دانشآموز
                                    {cls.maxCapacity && ` / ${cls.maxCapacity} ظرفیت`}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-[var(--border)]">
                                {cls.nextSession ? (
                                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>
                                            جلسه بعدی: {toJalali(cls.nextSession.date)} ({getPersianDayName(cls.nextSession.date)})
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-[var(--muted-foreground)]">
                                        بدون جلسه آینده
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Link>
                <div className="flex gap-2 px-6 pb-4 pt-0 border-t border-[var(--border)] mt-auto">
                    <Link href={`/dashboard/admin/classes/${cls.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                            <Pencil className="h-3.5 w-3.5" />
                            ویرایش
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClass(e, cls.id, cls.name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="کلاسها" />

            <main className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                                کلاسها
                            </h1>
                            <p className="text-[var(--muted-foreground)]">
                                مشاهده و مدیریت کلاسهای آموزشی
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {completedClasses.length > 0 && (
                                <Button
                                    variant={showCompleted ? "default" : "outline"}
                                    onClick={() => setShowCompleted(!showCompleted)}
                                >
                                    <CheckCircle className="h-4 w-4 ml-2" />
                                    کلاسهای خاتمه یافته ({completedClasses.length})
                                </Button>
                            )}
                            <Link href="/dashboard/admin/classes/create">
                                <Button className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    ایجاد کلاس جدید
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                        </div>
                    ) : !hasContent ? (
                        <Card>
                            <CardContent className="py-12">
                                <p className="text-center text-[var(--muted-foreground)]">
                                    هیچ کلاسی یافت نشد
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Active Classes */}
                            {activeClasses.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-[var(--foreground)]">کلاسهای فعال</h3>
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {activeClasses.map((cls) => renderClassCard(cls))}
                                    </div>
                                </div>
                            )}

                            {/* Completed Classes */}
                            {showCompleted && completedClasses.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-[var(--foreground)]">کلاسهای خاتمه یافته</h3>
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {completedClasses.map((cls) => renderClassCard(cls))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
