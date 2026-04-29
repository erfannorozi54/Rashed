"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GraduationCap, Calendar, Clock, Timer } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";

interface PublicClass {
    id: string;
    name: string;
    description: string | null;
    sessionPrice: number;
    sessionDuration: number;
    sessionCount: number;
    heldSessionsCount: number;
    remainingSessionsCount: number;
    scheduleInfo: string;
    scheduleDetails: {
        days: string[];
        times: string[];
    } | null;
    studentCount: number;
    maxCapacity: number | null;
    teachers: { id: string; name: string }[];
}

function formatPrice(price: number): string {
    if (price === 0) return "رایگان";
    return price.toLocaleString("fa-IR") + " تومان";
}

export default function PublicClassesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [classes, setClasses] = useState<PublicClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await fetch("/api/classes/public");
            const data = await res.json();
            if (res.ok) setClasses(data.classes || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const handleEnroll = async (classId: string) => {
        if (status === "unauthenticated") {
            router.push(`/auth/login?callbackUrl=/classes`);
            return;
        }

        if (session?.user?.role !== "STUDENT") {
            showToast("برای ثبتنام باید با حساب دانشآموز وارد شوید");
            return;
        }

        setEnrollingId(classId);
        try {
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classId }),
            });
            const data = await res.json();

            if (res.ok) {
                if (data.enrolled) {
                    showToast("ثبتنام با موفقیت انجام شد");
                    fetchClasses();
                } else if (data.redirectUrl) {
                    router.push(data.redirectUrl);
                }
            } else {
                showToast(data.error || "خطا در ثبتنام");
            }
        } catch (e) {
            showToast("خطا در ثبتنام");
        } finally {
            setEnrollingId(null);
        }
    };

    const activeClasses = classes.filter((cls) => cls.remainingSessionsCount > 0);

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="کلاسهای عمومی" />

            {toast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--foreground)] text-white px-6 py-3 rounded-lg shadow-lg text-sm">
                    {toast}
                </div>
            )}

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">کلاسهای عمومی</h1>
                    <p className="text-[var(--muted-foreground)]">
                        کلاسهای موجود را مشاهده کرده و در آنها ثبتنام کنید
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]"></div>
                    </div>
                ) : activeClasses.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-16">
                            <p className="text-[var(--muted-foreground)] text-lg">در حال حاضر کلاسی برای ثبتنام وجود ندارد</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeClasses.map((cls) => {
                            const isFull = !!(cls.maxCapacity && cls.studentCount >= cls.maxCapacity);
                            const firstSession = cls.scheduleDetails?.times[0];
                            const lastSession = cls.scheduleDetails?.times[cls.scheduleDetails.times.length - 1];
                            return (
                                <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl mb-1">{cls.name}</CardTitle>
                                                {cls.teachers.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
                                                        <GraduationCap className="h-4 w-4 shrink-0" />
                                                        <span>{cls.teachers.map((t) => t.name).join("، ")}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {isFull && (
                                                <span className="shrink-0 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                                    تکمیل ظرفیت
                                                </span>
                                            )}
                                        </div>
                                        {cls.description && (
                                            <CardDescription className="mt-2 line-clamp-2">{cls.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {cls.scheduleDetails && (
                                            <div className="rounded-lg bg-[var(--muted)]/50 p-3 space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-4 w-4 text-[var(--primary-600)]" />
                                                    <span className="font-medium">{cls.scheduleDetails.days.join(" و ")}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="h-4 w-4 text-[var(--primary-600)]" />
                                                    <span>{firstSession} - {lastSession}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Timer className="h-4 w-4 text-[var(--primary-600)]" />
                                                    <span>{cls.sessionDuration} دقیقه</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="rounded-lg bg-blue-50 p-2 text-center">
                                                <div className="text-xs text-blue-600 mb-1">کل جلسات</div>
                                                <div className="text-lg font-bold text-blue-700">{cls.sessionCount}</div>
                                            </div>
                                            <div className="rounded-lg bg-emerald-50 p-2 text-center">
                                                <div className="text-xs text-emerald-600 mb-1">باقیمانده</div>
                                                <div className="text-lg font-bold text-emerald-700">{cls.remainingSessionsCount}</div>
                                            </div>
                                            <div className="rounded-lg bg-orange-50 p-2 text-center">
                                                <div className="text-xs text-orange-600 mb-1">برگزار شده</div>
                                                <div className="text-lg font-bold text-orange-700">{cls.heldSessionsCount}</div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-purple-50 p-3 text-center">
                                            <div className="text-xs text-purple-600 mb-1">ظرفیت</div>
                                            <div className="text-lg font-bold text-purple-700">
                                                {cls.studentCount}
                                                {cls.maxCapacity && ` / ${cls.maxCapacity}`}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border-2 border-[var(--primary-200)] bg-[var(--primary-50)] p-3 text-center">
                                            <div className="text-sm text-[var(--primary-700)] mb-1">هزینه هر جلسه</div>
                                            <div className="text-2xl font-bold text-[var(--primary-700)]">
                                                {formatPrice(cls.sessionPrice)}
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full"
                                            onClick={() => handleEnroll(cls.id)}
                                            disabled={enrollingId === cls.id || isFull}
                                        >
                                            {enrollingId === cls.id 
                                                ? "در حال پردازش..." 
                                                : isFull 
                                                ? "ظرفیت تکمیل است" 
                                                : "ثبت‌نام در کلاس"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
