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
  teachers: Teacher[];
  studentCount: number;
  latestSession: Session | null;
  createdAt: string;
  enrollmentStatus?: "PENDING_PAYMENT" | "ENROLLED" | "CANCELLED";
  paidAmount?: number;
  payment?: { id: string; amount: number; status: string } | null;
}

interface Specialization {
  subject: string;
  grade: string;
  content: string;
}

interface PrivateBooking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";
  teacher: { id: string; name: string };
  specialization: Specialization | null;
}

const ENROLLMENT_BADGE = {
  ENROLLED: { label: "ثبت‌نام شده", className: "bg-green-100 text-green-700" },
  PENDING_PAYMENT: { label: "در انتظار پرداخت", className: "bg-amber-100 text-amber-700" },
  CANCELLED: { label: "لغو شده", className: "bg-gray-100 text-gray-600" },
};

const BOOKING_BADGE = {
  CONFIRMED: { label: "تأیید شده", className: "bg-green-100 text-green-700" },
  PENDING_PAYMENT: { label: "در انتظار پرداخت", className: "bg-amber-100 text-amber-700" },
  CANCELLED: { label: "لغو شده", className: "bg-gray-100 text-gray-600" },
};

export default function StudentClassesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [privateBookings, setPrivateBookings] = useState<PrivateBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.role !== "STUDENT") {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    try {
      const [classesRes, bookingsRes] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/private-bookings"),
      ]);
      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.classes || []);
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        // Exclude cancelled bookings
        setPrivateBookings((data.bookings || []).filter((b: PrivateBooking) => b.status !== "CANCELLED"));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.role !== "STUDENT") {
    return null;
  }

  const hasContent = classes.length > 0 || privateBookings.length > 0;

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
              {/* Regular Classes */}
              {classes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">کلاس‌های گروهی</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {classes.map((cls) => (
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
                              <span>آخرین جلسه: {new Date(cls.latestSession.date).toLocaleDateString("fa-IR")}</span>
                            </div>
                          )}

                          {/* Pending payment notice */}
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

              {/* Private Bookings */}
              {privateBookings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">کلاس‌های خصوصی</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {privateBookings.map((booking) => (
                      <Card key={booking.id} className="hover:shadow-lg transition-shadow border-purple-100">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="flex items-center gap-2">
                              <User className="h-5 w-5 text-purple-600" />
                              کلاس خصوصی
                            </CardTitle>
                            {BOOKING_BADGE[booking.status] && (
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0 mt-1", BOOKING_BADGE[booking.status].className)}>
                                {BOOKING_BADGE[booking.status].label}
                              </span>
                            )}
                          </div>
                          {booking.specialization && (
                            <CardDescription>
                              {booking.specialization.subject} — پایه {booking.specialization.grade}
                              {booking.specialization.content ? ` — ${booking.specialization.content}` : ""}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                            <User className="h-4 w-4" />
                            <span>استاد: {booking.teacher.name}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(booking.date).toLocaleDateString("fa-IR")}
                              {" — "}
                              {booking.startTime} تا {booking.endTime}
                            </span>
                          </div>

                          {booking.amount > 0 && (
                            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                              <CreditCard className="h-4 w-4" />
                              <span>{booking.amount.toLocaleString("fa-IR")} تومان</span>
                            </div>
                          )}

                          {booking.status === "PENDING_PAYMENT" && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-800 mb-2">
                                در انتظار پرداخت: {booking.amount.toLocaleString("fa-IR")} تومان
                              </p>
                              <Link href={`/payment/mock?booking_id=${booking.id}&type=private`}>
                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white w-full">
                                  <CreditCard className="h-4 w-4 ml-1" />
                                  پرداخت
                                </Button>
                              </Link>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
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
