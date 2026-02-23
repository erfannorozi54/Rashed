"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { User, BookOpen, Calendar, TrendingUp, CheckCircle, XCircle, FileText, CreditCard } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Input } from "@/components/ui/Input";

interface Teacher {
    id: string;
    name: string;
}

interface ClassStats {
    classId: string;
    className: string;
    classDescription: string | null;
    teachers: Teacher[];
    enrolledAt: string;
    statistics: {
        totalSessions: number;
        presentCount: number;
        absentCount: number;
        unmarkedCount: number;
        attendanceRate: number;
    };
}

interface TeachingClass {
    classId: string;
    className: string;
    classDescription: string | null;
    studentCount: number;
}

interface UserData {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        name: string;
        phone: string;
        email: string | null;
        role: string;
        maxDebtLimit: number;
        createdAt: string;
    };
    enrolledClasses: ClassStats[];
    teachingClasses: TeachingClass[];
    overallStatistics: {
        totalEnrolledClasses: number;
        totalTeachingClasses: number;
        totalAttendanceRecords: number;
        totalPresent: number;
        totalAbsent: number;
        overallAttendanceRate: number;
        totalBlogs: number;
    };
    recentActivity: {
        recentBlogs: any[];
        recentAttendance: any[];
    };
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchUserData();
    }, [session, router, id]);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`/api/users/${id}`);
            const data = await response.json();
            if (response.ok) {
                setUserData(data);
            } else {
                alert(data.error || "خطا در دریافت اطلاعات");
                router.push("/dashboard/admin");
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

    if (!userData) {
        return null;
    }

    const { user, enrolledClasses, teachingClasses, overallStatistics, recentActivity } = userData;

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="جزئیات کاربر" />

            <main className="container mx-auto px-4 py-8">
                {/* User Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            اطلاعات کاربر
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">نام و نام خانوادگی</p>
                                <p className="font-medium">{user.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">شماره تلفن</p>
                                <p className="font-medium font-mono">{user.phone}</p>
                            </div>
                            {user.email && (
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">ایمیل</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">نقش</p>
                                <span
                                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${user.role === "ADMIN"
                                        ? "bg-red-100 text-red-700"
                                        : user.role === "TEACHER"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                >
                                    {user.role === "ADMIN" ? "مدیر" : user.role === "TEACHER" ? "معلم" : "دانش‌آموز"}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">تاریخ ثبت‌نام</p>
                                <p className="font-medium">
                                    {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Debt Limit — Students only */}
                {user.role === "STUDENT" && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                سقف بدهی
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-3">
                                <div className="space-y-1">
                                    <p className="text-sm text-[var(--muted-foreground)]">حداکثر بدهی مجاز (تومان)</p>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        defaultValue={user.maxDebtLimit.toLocaleString()}
                                        onBlur={async (e) => {
                                            const val = Number(e.target.value.replace(/\D/g, ""));
                                            if (val === user.maxDebtLimit) return;
                                            const res = await fetch(`/api/users/${id}`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ maxDebtLimit: val }),
                                            });
                                            if (res.ok) {
                                                alert("سقف بدهی بروزرسانی شد");
                                                fetchUserData();
                                            }
                                        }}
                                        className="w-48"
                                    />
                                </div>
                                <p className="text-sm text-[var(--muted-foreground)] pb-2">
                                    فعلی: {user.maxDebtLimit.toLocaleString("fa-IR")} تومان
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Overall Statistics */}
                <div className="grid gap-6 md:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">کلاس‌های ثبت‌نام شده</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{overallStatistics.totalEnrolledClasses}</p>
                        </CardContent>
                    </Card>

                    {user.role === "TEACHER" && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">کلاس‌های تدریس</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{overallStatistics.totalTeachingClasses}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">نرخ حضور کلی</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-600">
                                {overallStatistics.overallAttendanceRate}%
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                {overallStatistics.totalPresent} از {overallStatistics.totalAttendanceRecords} جلسه
                            </p>
                        </CardContent>
                    </Card>

                    {user.role === "TEACHER" && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">بلاگ‌ها</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{overallStatistics.totalBlogs}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Enrolled Classes with Statistics */}
                {enrolledClasses.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                کلاس‌های ثبت‌نام شده و آمار حضور
                            </CardTitle>
                            <CardDescription>
                                آمار حضور و غیاب در هر کلاس
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {enrolledClasses.map((cls) => (
                                    <div
                                        key={cls.classId}
                                        className="p-4 rounded-lg border border-[var(--border)] bg-white"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">{cls.className}</h3>
                                                {cls.classDescription && (
                                                    <p className="text-sm text-[var(--muted-foreground)]">
                                                        {cls.classDescription}
                                                    </p>
                                                )}
                                                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                                    اساتید: {cls.teachers.map((t) => t.name).join("، ")}
                                                </p>
                                                <p className="text-xs text-[var(--muted-foreground)]">
                                                    تاریخ ثبت‌نام: {new Date(cls.enrolledAt).toLocaleDateString("fa-IR")}
                                                </p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-2xl font-bold text-[var(--primary-600)]">
                                                    {cls.statistics.attendanceRate}%
                                                </p>
                                                <p className="text-xs text-[var(--muted-foreground)]">نرخ حضور</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3 mt-3">
                                            <div className="text-center p-2 rounded bg-[var(--muted)]">
                                                <p className="text-lg font-semibold">{cls.statistics.totalSessions}</p>
                                                <p className="text-xs text-[var(--muted-foreground)]">کل جلسات</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-green-50">
                                                <p className="text-lg font-semibold text-green-600 flex items-center justify-center gap-1">
                                                    <CheckCircle className="h-4 w-4" />
                                                    {cls.statistics.presentCount}
                                                </p>
                                                <p className="text-xs text-green-700">حاضر</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-red-50">
                                                <p className="text-lg font-semibold text-red-600 flex items-center justify-center gap-1">
                                                    <XCircle className="h-4 w-4" />
                                                    {cls.statistics.absentCount}
                                                </p>
                                                <p className="text-xs text-red-700">غایب</p>
                                            </div>
                                            <div className="text-center p-2 rounded bg-gray-50">
                                                <p className="text-lg font-semibold text-gray-600">
                                                    {cls.statistics.unmarkedCount}
                                                </p>
                                                <p className="text-xs text-gray-700">ثبت نشده</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Teaching Classes */}
                {teachingClasses.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                کلاس‌های تدریس
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {teachingClasses.map((cls) => (
                                    <div
                                        key={cls.classId}
                                        className="flex items-center justify-between p-3 rounded border border-[var(--border)]"
                                    >
                                        <div>
                                            <p className="font-medium">{cls.className}</p>
                                            {cls.classDescription && (
                                                <p className="text-sm text-[var(--muted-foreground)]">
                                                    {cls.classDescription}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            {cls.studentCount} دانش‌آموز
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Activity */}
                {recentActivity.recentAttendance.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                فعالیت اخیر
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {recentActivity.recentAttendance.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 rounded border border-[var(--border)]"
                                    >
                                        <div className="flex items-center gap-2">
                                            {activity.status === "PRESENT" ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-600" />
                                            )}
                                            <span className="text-sm">{activity.className}</span>
                                        </div>
                                        <span className="text-xs text-[var(--muted-foreground)]">
                                            {new Date(activity.markedAt).toLocaleDateString("fa-IR")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
