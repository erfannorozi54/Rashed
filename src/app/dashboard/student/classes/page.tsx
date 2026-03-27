"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Calendar, Users, FileText, Globe, CreditCard, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { toJalali, getPersianDayName, formatTime } from "@/lib/jalali-utils";

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
  classType: "PUBLIC" | "SEMI_PRIVATE" | "PRIVATE";
  teachers: Teacher[];
  studentCount: number;
  latestSession: Session | null;
  sessionDuration: number;
  sessionPrice: number;
  createdAt: string;
  enrollmentStatus?: "PENDING_PAYMENT" | "ENROLLED" | "CANCELLED";
  paidAmount?: number;
  payment?: { id: string; amount: number; status: string } | null;
}

const ENROLLMENT_BADGE = {
  ENROLLED: { label: "ثبت‌نام شده", className: "bg-green-100 text-green-700" },
  PENDING_PAYMENT: { label: "در انتظار پرداخت", className: "bg-amber-100 text-amber-700" },
  CANCELLED: { label: "لغو شده", className: "bg-gray-100 text-gray-600" },
};

function getSessionTimes(dateStr: string, durationMin: number) {
  const start = new Date(dateStr);
  const end = new Date(start.getTime() + durationMin * 60_000);
  return { startTime: formatTime(start), endTime: formatTime(end) };
}

export default function StudentClassesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "STUDENT") {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role !== "STUDENT") {
    return null;
  }

  const groupClasses = classes.filter((c) => c.classType !== "PRIVATE");
  const privateClasses = classes.filter((c) => c.classType === "PRIVATE");
  const hasContent = classes.length > 0;

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <DashboardHeader title="کلاس‌های من" />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">کلاس‌های من</h2>
              <p className="text-[var(--muted-foreground)]">لیست کلاس‌ها و کلاس‌های خصوصی رزرو شده</p>
            </div>
            <Link href="/classes">
              <Button variant="outline">
                <Globe className="h-4 w-4 ml-2" />
                مشاهده کلاس‌های عمومی
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
            </div>
          ) : !hasContent ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-[var(--muted-foreground)]" />
                <p className="text-[var(--muted-foreground)] mb-2">هنوز در هیچ کلاسی ثبت‌نام نکرده‌اید</p>
                <div className="flex justify-center gap-3 mt-4">
                  <Link href="/classes">
                    <Button>
                      <Globe className="h-4 w-4 ml-2" />
                      مشاهده کلاس‌های عمومی
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Regular (group) Classes */}
              {groupClasses.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">کلاس‌های گروهی</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {groupClasses.map((cls) => (
                      <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-[var(--primary-600)]" />
                              {cls.name}
                            </CardTitle>
                            {cls.enrollmentStatus && ENROLLMENT_BADGE[cls.enrollmentStatus] && (
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0 mt-1", ENROLLMENT_BADGE[cls.enrollmentStatus].className)}>
                                {ENROLLMENT_BADGE[cls.enrollmentStatus].label}
                              </span>
                            )}
                          </div>
                          {cls.description && <CardDescription>{cls.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                            <Users className="h-4 w-4" />
                            <span>اساتید: {cls.teachers.map((t) => t.name).join("، ")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                            <Users className="h-4 w-4" />
                            <span>{cls.studentCount} دانش‌آموز</span>
                          </div>
                          {cls.latestSession && (
                            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                              <Calendar className="h-4 w-4" />
                              <span>آخرین جلسه: {toJalali(cls.latestSession.date)} ({getPersianDayName(cls.latestSession.date)})</span>
                            </div>
                          )}
                          {cls.enrollmentStatus === "PENDING_PAYMENT" && cls.payment && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-800 mb-2">
                                در انتظار پرداخت: {cls.payment.amount.toLocaleString("fa-IR")} تومان
                              </p>
                              <Link href={`/payment/mock?payment_id=${cls.payment.id}`}>
                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white w-full">
                                  <CreditCard className="h-4 w-4 ml-1" />
                                  پرداخت
                                </Button>
                              </Link>
                            </div>
                          )}
                          <Link href={`/dashboard/student/classes/${cls.id}`}>
                            <Button className="w-full" variant={cls.enrollmentStatus === "PENDING_PAYMENT" ? "outline" : "default"}>
                              <FileText className="h-4 w-4 ml-2" />
                              مشاهده جزئیات
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Private Classes */}
              {privateClasses.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">کلاس‌های خصوصی</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {privateClasses.map((cls) => {
                      const times = cls.latestSession
                        ? getSessionTimes(cls.latestSession.date, cls.sessionDuration ?? 90)
                        : null;
                      const sessionDate = cls.latestSession ? new Date(cls.latestSession.date) : null;

                      return (
                        <Card key={cls.id} className="hover:shadow-lg transition-shadow border-purple-100">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-purple-600" />
                                کلاس خصوصی
                              </CardTitle>
                              {cls.enrollmentStatus && ENROLLMENT_BADGE[cls.enrollmentStatus] && (
                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0 mt-1", ENROLLMENT_BADGE[cls.enrollmentStatus].className)}>
                                  {ENROLLMENT_BADGE[cls.enrollmentStatus].label}
                                </span>
                              )}
                            </div>
                            {cls.description && (
                              <CardDescription>{cls.description}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {cls.teachers.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                <User className="h-4 w-4" />
                                <span>استاد: {cls.teachers[0].name}</span>
                              </div>
                            )}
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
                              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                <CreditCard className="h-4 w-4" />
                                <span>{cls.sessionPrice.toLocaleString("fa-IR")} تومان</span>
                              </div>
                            )}
                            {cls.enrollmentStatus === "PENDING_PAYMENT" && cls.payment && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800 mb-2">
                                  در انتظار پرداخت: {cls.payment.amount.toLocaleString("fa-IR")} تومان
                                </p>
                                <Link href={`/payment/mock?payment_id=${cls.payment.id}`}>
                                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white w-full">
                                    <CreditCard className="h-4 w-4 ml-1" />
                                    پرداخت
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
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
