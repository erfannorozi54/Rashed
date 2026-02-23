"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GraduationCap, Users, Calendar, ArrowLeft, BookOpen } from "lucide-react";

interface PublicClass {
    id: string;
    name: string;
    description: string | null;
    sessionPrice: number;
    sessionCount: number;
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
            showToast("برای ثبت‌نام باید با حساب دانش‌آموز وارد شوید");
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
                    showToast("ثبت‌نام با موفقیت انجام شد");
                    fetchClasses();
                } else if (data.redirectUrl) {
                    router.push(data.redirectUrl);
                }
            } else {
                showToast(data.error || "خطا در ثبت‌نام");
            }
        } catch (e) {
            showToast("خطا در ثبت‌نام");
        } finally {
            setEnrollingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            {/* Header */}
            <header className="bg-white border-b border-[var(--border)] sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] p-2 rounded-xl">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-[var(--foreground)]">آموزشگاه راشد</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <Button variant="ghost" size="sm">صفحه اصلی</Button>
                        </Link>
                        {status === "authenticated" ? (
                            <Link href="/dashboard">
                                <Button size="sm">داشبورد</Button>
                            </Link>
                        ) : (
                            <Link href="/auth/login">
                                <Button size="sm">ورود</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Toast */}
            {toast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--foreground)] text-white px-6 py-3 rounded-lg shadow-lg text-sm">
                    {toast}
                </div>
            )}

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">کلاس‌های عمومی</h1>
                    <p className="text-[var(--muted-foreground)]">
                        کلاس‌های موجود را مشاهده کرده و در آن‌ها ثبت‌نام کنید
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]"></div>
                    </div>
                ) : classes.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-16">
                            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30 text-[var(--muted-foreground)]" />
                            <p className="text-[var(--muted-foreground)] text-lg">در حال حاضر کلاسی برای ثبت‌نام وجود ندارد</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {classes.map((cls) => (
                            <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                                    {cls.description && (
                                        <CardDescription className="line-clamp-2">{cls.description}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {cls.teachers.length > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                            <GraduationCap className="h-4 w-4 shrink-0" />
                                            <span>{cls.teachers.map((t) => t.name).join("، ")}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {cls.sessionCount} جلسه
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {cls.studentCount} دانش‌آموز
                                            {cls.maxCapacity ? ` / ${cls.maxCapacity}` : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                                        <span className="font-bold text-[var(--primary-600)] text-lg">
                                            {formatPrice(cls.sessionPrice)}
                                        </span>
                                        <Button
                                            size="sm"
                                            onClick={() => handleEnroll(cls.id)}
                                            disabled={enrollingId === cls.id}
                                        >
                                            {enrollingId === cls.id ? "در حال پردازش..." : "ثبت‌نام"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
