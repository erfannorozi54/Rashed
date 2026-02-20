"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Calendar, FileText, LogOut, GraduationCap, ChevronLeft } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { SessionTypeBadge } from "@/components/SessionTypeBadge";


export default function StudentDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({
        activeClasses: 0,
        pendingAssignments: 0,
        weeklySessions: 0,
    });
    const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.role === "STUDENT") {
            fetchDashboardData();
        }
    }, [session]);

    const fetchDashboardData = async () => {
        try {
            // Fetch upcoming sessions
            const sessionsRes = await fetch("/api/sessions?type=upcoming");
            const sessionsData = await sessionsRes.json();

            if (sessionsRes.ok) {
                setUpcomingSessions(sessionsData.sessions || []);
            }

            // Fetch classes for stats
            const classesRes = await fetch("/api/classes");
            const classesData = await classesRes.json();

            // Fetch pending assignments
            const assignmentsRes = await fetch("/api/assignments?status=pending");
            const assignmentsData = await assignmentsRes.json();

            setStats({
                activeClasses: classesData.classes?.length || 0,
                pendingAssignments: assignmentsData.assignments?.length || 0,
                weeklySessions: sessionsData.sessions?.filter((s: any) => {
                    const sessionDate = new Date(s.date);
                    const now = new Date();
                    const oneWeekFromNow = new Date();
                    oneWeekFromNow.setDate(now.getDate() + 7);
                    return sessionDate >= now && sessionDate <= oneWeekFromNow;
                }).length || 0,
            });


        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="پنل دانش‌آموز" />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                        داشبورد دانش‌آموز
                    </h1>
                    <p className="text-[var(--muted-foreground)]">
                        به پنل کاربری خود خوش آمدید
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">کلاس‌های من</CardTitle>
                            <BookOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeClasses}</div>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                کلاس فعال
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">تکالیف</CardTitle>
                            <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                تکلیف در انتظار
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">جلسات</CardTitle>
                            <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.weeklySessions}</div>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                جلسه در ۷ روز آینده
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Sessions Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>جلسات پیش‌رو</CardTitle>
                            <CardDescription>
                                برنامه کلاس‌های آینده شما
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                                </div>
                            ) : upcomingSessions.length === 0 ? (
                                <div className="text-center py-8 text-[var(--muted-foreground)]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-[var(--primary-600)]" />
                                            جلسات پیش‌رو
                                        </h2>
                                        <Link href="/dashboard/student/schedule">
                                            <Button variant="ghost" size="sm" className="text-[var(--primary-600)]">
                                                مشاهده تقویم کامل
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>هیچ جلسه‌ای برای آینده برنامه‌ریزی نشده است</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {upcomingSessions.map((session: any) => (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between p-4 bg-white border border-[var(--border)] rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex flex-col items-center justify-center border border-blue-100">
                                                    <span className="text-xs font-bold">{new Date(session.date).toLocaleDateString('fa-IR', { month: 'short' })}</span>
                                                    <span className="text-lg font-bold">{new Date(session.date).toLocaleDateString('fa-IR', { day: 'numeric' })}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-[var(--foreground)]">
                                                            {session.title}
                                                        </h4>
                                                        <SessionTypeBadge type={session.type} />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                                        <BookOpen className="h-3 w-3" />
                                                        <span>{session.class.name}</span>
                                                        <span className="mx-1">•</span>
                                                        <Calendar className="h-3 w-3" />
                                                        <span>
                                                            {new Date(session.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link href={`/dashboard/student/classes/${session.class.id}`}>
                                                <Button variant="outline" size="sm">
                                                    مشاهده کلاس
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
