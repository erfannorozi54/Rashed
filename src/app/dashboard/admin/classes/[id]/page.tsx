"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GraduationCap, Users, Calendar, FileText, CheckCircle, XCircle, Globe, Key, Lock, Clock, Pencil, Plus, Trash2, Search, CalendarCheck, CalendarClock } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { SessionTypeBadge } from "@/components/SessionTypeBadge";
import { cn } from "@/lib/utils";
import { toJalali, getPersianDayName, formatTime } from "@/lib/jalali-utils";

interface Teacher {
    id: string;
    name: string;
    phone: string;
}

interface EnrolledStudent {
    id: string;
    name: string;
    phone: string;
    enrollmentId: string;
    enrollmentStatus: "PENDING_PAYMENT" | "ENROLLED" | "CANCELLED";
    paidAmount: number;
    payment: { id: string; amount: number; status: string } | null;
    statistics?: {
        totalSessions: number;
        presentCount: number;
        absentCount: number;
        attendanceRate: number;
    };
}

interface AllStudent {
    id: string;
    name: string;
    phone: string;
}

interface SessionData {
    id: string;
    title: string;
    description: string | null;
    date: string;
    type: "SCHEDULED" | "COMPENSATORY";
    createdAt: string;
    attendanceCount: {
        total: number;
        present: number;
        absent: number;
    };
    contents: { id: string; title: string; fileType: string }[];
    assignments: { id: string; title: string; dueDate: string | null }[];
}

type ClassType = "PUBLIC" | "SEMI_PRIVATE" | "PRIVATE";

const CLASS_TYPE_CONFIG: Record<ClassType, { label: string; icon: React.ReactNode; className: string }> = {
    PUBLIC: { label: "عمومی", icon: <Globe className="h-3 w-3" />, className: "bg-green-100 text-green-700 border-green-200" },
    SEMI_PRIVATE: { label: "نیمه خصوصی", icon: <Key className="h-3 w-3" />, className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    PRIVATE: { label: "خصوصی", icon: <Lock className="h-3 w-3" />, className: "bg-red-100 text-red-700 border-red-200" },
};

const ENROLLMENT_STATUS_CONFIG = {
    ENROLLED: { label: "ثبت‌نام شده", className: "bg-green-100 text-green-700" },
    PENDING_PAYMENT: { label: "در انتظار پرداخت", className: "bg-amber-100 text-amber-700" },
    CANCELLED: { label: "لغو شده", className: "bg-gray-100 text-gray-600" },
};

interface ClassDetail {
    id: string;
    name: string;
    description: string | null;
    classType: ClassType;
    maxCapacity: number | null;
    sessionDuration: number;
    sessionPrice: number;
    minSessionsToPay: number | null;
    createdAt: string;
    teachers: Teacher[];
    sessions: SessionData[];
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [classData, setClassData] = useState<ClassDetail | null>(null);
    const [students, setStudents] = useState<EnrolledStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [allStudents, setAllStudents] = useState<AllStudent[]>([]);
    const [studentSearch, setStudentSearch] = useState("");
    const [addingStudentId, setAddingStudentId] = useState<string | null>(null);
    const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchClassData();
        fetchStudents();
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
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch(`/api/classes/${id}/students`);
            const data = await res.json();
            if (res.ok) setStudents(data.students || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const res = await fetch("/api/users?role=STUDENT");
            const data = await res.json();
            if (res.ok) setAllStudents(data.users || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleShowAddStudent = () => {
        setShowAddStudent(true);
        fetchAllStudents();
    };

    const handleAddStudent = async (studentId: string) => {
        setAddingStudentId(studentId);
        try {
            const res = await fetch(`/api/classes/${id}/students`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId }),
            });
            const data = await res.json();
            if (res.ok) {
                fetchStudents();
                setShowAddStudent(false);
                setStudentSearch("");
            } else {
                alert(data.error || "خطا در افزودن دانش‌آموز");
            }
        } catch (e) {
            alert("خطا در افزودن دانش‌آموز");
        } finally {
            setAddingStudentId(null);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!confirm("آیا از حذف این دانش‌آموز اطمینان دارید؟")) return;
        setRemovingStudentId(studentId);
        try {
            const res = await fetch(`/api/classes/${id}/students/${studentId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchStudents();
            } else {
                const data = await res.json();
                alert(data.error || "خطا در حذف دانش‌آموز");
            }
        } catch (e) {
            alert("خطا در حذف دانش‌آموز");
        } finally {
            setRemovingStudentId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]"></div>
            </div>
        );
    }

    if (!classData) return null;

    const enrolledStudents = students.filter((s) => s.enrollmentStatus === "ENROLLED");

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="جزئیات کلاس" />

            <main className="container mx-auto px-4 py-8">
                {/* Class Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                اطلاعات کلاس
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const typeConf = CLASS_TYPE_CONFIG[classData.classType] ?? CLASS_TYPE_CONFIG.PUBLIC;
                                    return (
                                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border", typeConf.className)}>
                                            {typeConf.icon}
                                            {typeConf.label}
                                        </span>
                                    );
                                })()}
                                <Link href={`/dashboard/admin/classes/${id}/edit`}>
                                    <Button size="sm" variant="outline">
                                        <Pencil className="h-4 w-4 ml-1" />
                                        ویرایش کلاس
                                    </Button>
                                </Link>
                            </div>
                        </div>
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
                                <p className="text-sm text-[var(--muted-foreground)]">دانش‌آموزان</p>
                                <p className="font-medium">
                                    {enrolledStudents.length} نفر ثبت‌نام شده
                                    {classData.maxCapacity && ` / ${classData.maxCapacity} ظرفیت`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">مدت هر جلسه</p>
                                    <p className="font-medium">{classData.sessionDuration} دقیقه</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">تعداد جلسات</p>
                                <p className="font-medium">{classData.sessions.length} جلسه</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">هزینه هر جلسه</p>
                                <p className="font-medium">
                                    {classData.sessionPrice === 0
                                        ? "رایگان"
                                        : `${classData.sessionPrice.toLocaleString("fa-IR")} تومان`}
                                </p>
                            </div>
                            {classData.sessionPrice > 0 && (
                                <div>
                                    <p className="text-sm text-[var(--muted-foreground)]">حداقل جلسات برای پرداخت</p>
                                    <p className="font-medium">
                                        {classData.minSessionsToPay === null
                                            ? "پرداخت کامل"
                                            : classData.minSessionsToPay === 0
                                            ? "رایگان (بدهی‌کار)"
                                            : `${classData.minSessionsToPay} جلسه`}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">تاریخ ایجاد</p>
                                <p className="font-medium">
                                    {new Date(classData.createdAt).toLocaleDateString("fa-IR")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Students */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                دانش‌آموزان ({students.length})
                            </CardTitle>
                            <Button size="sm" onClick={handleShowAddStudent}>
                                <Plus className="h-4 w-4 ml-1" />
                                افزودن دانش‌آموز
                            </Button>
                        </div>
                        <CardDescription>وضعیت ثبت‌نام و پرداخت دانش‌آموزان</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Add student panel */}
                        {showAddStudent && (
                            <div className="mb-6 p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)] space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">انتخاب دانش‌آموز</h4>
                                    <Button size="sm" variant="ghost" onClick={() => { setShowAddStudent(false); setStudentSearch(""); }}>
                                        بستن
                                    </Button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                                    <Input
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        placeholder="جستجو بر اساس نام یا شماره..."
                                        className="pr-9"
                                    />
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {allStudents
                                        .filter(
                                            (s) =>
                                                !students.some((es) => es.id === s.id) &&
                                                (s.name.includes(studentSearch) || s.phone.includes(studentSearch))
                                        )
                                        .map((student) => (
                                            <div
                                                key={student.id}
                                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-[var(--border)]"
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{student.name}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)] font-mono">{student.phone}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddStudent(student.id)}
                                                    disabled={addingStudentId === student.id}
                                                >
                                                    {addingStudentId === student.id ? "در حال افزودن..." : "افزودن"}
                                                </Button>
                                            </div>
                                        ))}
                                    {allStudents.filter((s) => !students.some((es) => es.id === s.id)).length === 0 && (
                                        <p className="text-center text-[var(--muted-foreground)] py-4 text-sm">
                                            تمام دانش‌آموزان در این کلاس ثبت‌نام شده‌اند
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {students.length === 0 ? (
                            <p className="text-center text-[var(--muted-foreground)] py-8">
                                دانش‌آموزی در این کلاس ثبت‌نام نکرده است
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="p-4 rounded-lg border border-[var(--border)] bg-white"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link
                                                        href={`/dashboard/admin/users/${student.id}`}
                                                        className="font-semibold hover:text-[var(--primary-600)]"
                                                    >
                                                        {student.name}
                                                    </Link>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                                        ENROLLMENT_STATUS_CONFIG[student.enrollmentStatus]?.className || "bg-gray-100 text-gray-600"
                                                    )}>
                                                        {ENROLLMENT_STATUS_CONFIG[student.enrollmentStatus]?.label || student.enrollmentStatus}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[var(--muted-foreground)] font-mono mt-0.5">
                                                    {student.phone}
                                                </p>
                                                {student.payment && (
                                                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                                        مبلغ: {student.payment.amount.toLocaleString("fa-IR")} تومان
                                                        {student.paidAmount > 0 && ` — پرداخت شده: ${student.paidAmount.toLocaleString("fa-IR")} تومان`}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleRemoveStudent(student.id)}
                                                disabled={removingStudentId === student.id}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
                        <CardDescription>تمامی جلسات برگزار شده و محتوای آن‌ها</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {classData.sessions.length === 0 ? (
                            <p className="text-center text-[var(--muted-foreground)] py-8">
                                هنوز جلسه‌ای برگزار نشده است
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {classData.sessions.map((sess) => (
                                    <div
                                        key={sess.id}
                                        className="p-4 rounded-lg border border-[var(--border)] bg-white hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">{sess.title}</h3>
                                                {sess.description && (
                                                    <p className="text-sm text-[var(--muted-foreground)] mt-1">{sess.description}</p>
                                                )}
                                                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                                    <Calendar className="h-3 w-3 inline ml-1" />
                                                    {new Date(sess.date).toLocaleDateString("fa-IR")}
                                                </p>
                                            </div>
                                        </div>

                                        {sess.contents.length > 0 && (
                                            <div className="mb-3 p-3 rounded bg-[var(--muted)]">
                                                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                                                    <FileText className="h-4 w-4" />
                                                    محتوای جلسه ({sess.contents.length})
                                                </p>
                                                <ul className="space-y-1">
                                                    {sess.contents.map((content) => (
                                                        <li key={content.id} className="text-sm text-[var(--muted-foreground)]">
                                                            • {content.title} ({content.fileType})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
                                                <span>{sess.attendanceCount.total} نفر</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>{sess.attendanceCount.present} حاضر</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-red-600">
                                                <XCircle className="h-4 w-4" />
                                                <span>{sess.attendanceCount.absent} غایب</span>
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
