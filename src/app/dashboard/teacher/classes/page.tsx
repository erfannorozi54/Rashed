"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Calendar, Users, PlusCircle, FileText, Globe, Key, Lock, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toJalali, getPersianDayName } from "@/lib/jalali-utils";

type ClassType = "PUBLIC" | "SEMI_PRIVATE" | "PRIVATE";

interface Teacher {
    id: string;
    name: string;
}

interface Session {
    id: string;
    title: string;
    date: string;
}

interface Class {
    id: string;
    name: string;
    description: string | null;
    classType: ClassType;
    teachers: Teacher[];
    studentCount: number;
    sessionDuration: number;
    sessionPrice: number;
    nextSession: Session | null;
    latestSession: Session | null;
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
        className: "bg-purple-100 text-purple-700 border-purple-200",
    },
};

function getSessionTimes(dateStr: string, durationMin: number) {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + durationMin * 60_000);
    const fmt = (d: Date) =>
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return { startTime: fmt(start), endTime: fmt(end) };
}

export default function TeacherClassesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.role !== "TEACHER" && session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchClasses();
    }, [session, router]);

    const fetchClasses = async () => {
        try {
            const response = await fetch("/api/teacher/classes");
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

    if (session?.user?.role !== "TEACHER" && session?.user?.role !== "ADMIN") {
        return null;
    }

    const groupClasses = classes.filter((c) => c.classType !== "PRIVATE");
    const privateClasses = classes.filter((c) => c.classType === "PRIVATE");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                        کلاسهای من
                    </h2>
                    <p className="text-[var(--muted-foreground)]">
                        تمام کلاسهایی که تدریس میکنید
                    </p>
                </div>
                <Link href="/dashboard/teacher/classes/create">
                    <Button>
                        <PlusCircle className="h-4 w-4 ml-2" />
                        ایجاد کلاس جدید
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                </div>
            ) : classes.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-[var(--muted-foreground)]" />
                        <p className="text-[var(--muted-foreground)]">
                            هنوز کلاسی ندارید
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Group / semi-private classes */}
                    {groupClasses.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">کلاسهای گروهی</h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {groupClasses.map((cls) => {
                                    const typeConfig = CLASS_TYPE_CONFIG[cls.classType];
                                    return (
                                        <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                                            <CardHeader>
                                                <div className="flex items-start justify-between gap-2">
                                                    <CardTitle className="flex items-center gap-2">
                                                        <BookOpen className="h-5 w-5 text-[var(--primary-600)]" />
                                                        {cls.name}
                                                    </CardTitle>
                                                    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shrink-0", typeConfig.className)}>
                                                        {typeConfig.icon}
                                                        {typeConfig.label}
                                                    </span>
                                                </div>
                                                {cls.description && (
                                                    <CardDescription>{cls.description}</CardDescription>
                                                )}
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                                    <Users className="h-4 w-4" />
                                                    <span>{cls.studentCount} دانشآموز</span>
                                                </div>
                                                {cls.nextSession ? (
                                                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            جلسه بعدی:{" "}
                                                            {toJalali(cls.nextSession.date)} ({getPersianDayName(cls.nextSession.date)})
                                                        </span>
                                                    </div>
                                                ) : cls.latestSession ? (
                                                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            آخرین جلسه:{" "}
                                                            {toJalali(cls.latestSession.date)} ({getPersianDayName(cls.latestSession.date)})
                                                        </span>
                                                    </div>
                                                ) : null}
                                                <Link href={`/dashboard/teacher/classes/${cls.id}`} className="block">
                                                    <Button className="w-full">
                                                        <FileText className="h-4 w-4 ml-2" />
                                                        مدیریت کلاس
                                                    </Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Private booking sessions */}
                    {privateClasses.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">جلسات خصوصی</h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {privateClasses.map((cls) => {
                                    const times = cls.nextSession
                                        ? getSessionTimes(cls.nextSession.date, cls.sessionDuration ?? 90)
                                        : cls.latestSession
                                        ? getSessionTimes(cls.latestSession.date, cls.sessionDuration ?? 90)
                                        : null;
                                    const sessionDate = cls.nextSession ? new Date(cls.nextSession.date) : cls.latestSession ? new Date(cls.latestSession.date) : null;
                                    return (
                                        <Card key={cls.id} className="hover:shadow-lg transition-shadow border-purple-100">
                                            <CardHeader>
                                                <div className="flex items-start justify-between gap-2">
                                                    <CardTitle className="flex items-center gap-2">
                                                        <User className="h-5 w-5 text-purple-600" />
                                                        جلسه خصوصی
                                                    </CardTitle>
                                                    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shrink-0", CLASS_TYPE_CONFIG.PRIVATE.className)}>
                                                        {CLASS_TYPE_CONFIG.PRIVATE.icon}
                                                        {CLASS_TYPE_CONFIG.PRIVATE.label}
                                                    </span>
                                                </div>
                                                {cls.description && (
                                                    <CardDescription>{cls.description}</CardDescription>
                                                )}
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                                    <Users className="h-4 w-4" />
                                                    <span>{cls.studentCount} دانشآموز</span>
                                                </div>
                                                {sessionDate && times && (
                                                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            {sessionDate.toLocaleDateString("fa-IR")}
                                                            {" — "}
                                                            {times.startTime} تا {times.endTime}
                                                        </span>
                                                    </div>
                                                )}
                                                {cls.sessionPrice > 0 && (
                                                    <p className="text-sm text-[var(--muted-foreground)]">
                                                        {cls.sessionPrice.toLocaleString("fa-IR")} تومان
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
