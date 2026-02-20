"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Users, Calendar, FileText, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";

interface Teacher {
    id: string;
    name: string;
    phone: string;
}

interface Student {
    id: string;
    name: string;
    phone: string;
    statistics: {
        totalSessions: number;
        presentCount: number;
        absentCount: number;
        attendanceRate: number;
    };
}

interface SessionData {
    id: string;
    title: string;
    description: string | null;
    date: string;
    createdAt: string;
    attendanceCount: {
        total: number;
        present: number;
        absent: number;
    };
    contents: {
        id: string;
        title: string;
        fileType: string;
    }[];
}

interface ClassDetail {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    teachers: Teacher[];
    students: Student[];
    sessions: SessionData[];
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [classData, setClassData] = useState<ClassDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchClassData();
    }, [session, router, id]);

    const fetchClassData = async () => {
        try {
            const response = await fetch(`/api/classes/${id}`);
            const data = await response.json();
            if (response.ok) {
                setClassData(data.class);
            } else {
                alert(data.error || "خطا در دریافت اطلاعات");
                router.push("/dashboard/admin/classes");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("خطا در دریافت اطلاعات");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]"></div>
            </div>
        );
    }

    if (!classData) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="جزئیات کلاس" />

            {/* Back Button Sub-header */}
            <div className="bg-white border-b border-[var(--border)]">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">{classData.name}</h1>
                        <Link href="/dashboard/admin/classes">
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 ml-2" />
                                بازگشت
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                {/* Class Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            اطلاعات کلاس
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">نام کلاس</p>
                                <p className="font-medium">{classData.name}</p>
                            </div>
                            {classData.description && (
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">توضیحات</p>
                                    <p className="font-medium">{classData.description}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">معلمان</p>
                                <p className="font-medium">
                                    {classData.teachers.map((t) => t.name).join("، ") || "بدون معلم"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">تعداد دانش‌آموزان</p>
                                <p className="font-medium">{classData.students.length} نفر</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">تعداد جلسات</p>
                                <p className="font-medium">{classData.sessions.length} جلسه</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">تاریخ ایجاد</p>
                                <p className="font-medium">
                                    {new Date(classData.createdAt).toLocaleDateString("fa-IR")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Students with Attendance Stats */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            دانش‌آموزان و آمار حضور ({classData.students.length})
                        </CardTitle>
                        <CardDescription>
                            نرخ حضور هر دانش‌آموز در این کلاس
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {classData.students.length === 0 ? (
                            <p className="text-center text-[var(--muted-foreground)] py-8">
                                دانش‌آموزی در این کلاس ثبت‌نام نکرده است
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {classData.students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="p-4 rounded-lg border border-[var(--border)] bg-white"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <Link
                                                    href={`/dashboard/admin/users/${student.id}`}
                                                    className="font-semibold hover:text-[var(--primary-600)]"
                                                >
                                                    {student.name}
                                                </Link>
                                                <p className="text-sm text-[var(--muted-foreground)] font-mono">
                                                    {student.phone}
                                                </p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-2xl font-bold text-[var(--primary-600)]">
                                                    {student.statistics.attendanceRate}%
                                                </p>
                                                <p className="text-xs text-[var(--muted-foreground)]">
                                                    نرخ حضور
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            <div className="text-center p-2 rounded bg-[var(--muted)]">
                                                <p className="text-sm font-semibold">{student.statistics.totalSessions}</p>
                                                <p className="text-xs text-[var(--muted-foreground)]">کل جلسات</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-green-50">
                                                <p className="text-sm font-semibold text-green-600">
                                                    {student.statistics.presentCount}
                                                </p>
                                                <p className="text-xs text-green-700">حاضر</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-red-50">
                                                <p className="text-sm font-semibold text-red-600">
                                                    {student.statistics.absentCount}
                                                </p>
                                                <p className="text-xs text-red-700">غایب</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            جلسات ({classData.sessions.length})
                        </CardTitle>
                        <CardDescription>
                            تمامی جلسات برگزار شده و محتوای آن‌ها
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {classData.sessions.length === 0 ? (
                            <p className="text-center text-[var(--muted-foreground)] py-8">
                                هنوز جلسه‌ای برگزار نشده است
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {classData.sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="p-4 rounded-lg border border-[var(--border)] bg-white hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">{session.title}</h3>
                                                {session.description && (
                                                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                                        {session.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                                    <Calendar className="h-3 w-3 inline ml-1" />
                                                    {new Date(session.date).toLocaleDateString("fa-IR")}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Session Contents */}
                                        {session.contents.length > 0 && (
                                            <div className="mb-3 p-3 rounded bg-[var(--muted)]">
                                                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                                    <FileText className="h-4 w-4" />
                                                    محتوای جلسه ({session.contents.length})
                                                </p>
                                                <ul className="space-y-1">
                                                    {session.contents.map((content) => (
                                                        <li key={content.id} className="text-sm text-[var(--muted-foreground)]">
                                                            • {content.title} ({content.fileType})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Attendance Stats */}
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                                                <span>{session.attendanceCount.total} نفر</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>{session.attendanceCount.present} حاضر</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-red-600">
                                                <XCircle className="h-4 w-4" />
                                                <span>{session.attendanceCount.absent} غایب</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
