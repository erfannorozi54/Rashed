"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Calendar, Users, PlusCircle, CheckCircle, XCircle, MinusCircle, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { SessionTypeBadge } from "@/components/SessionTypeBadge";

interface Student {
    id: string;
    name: string;
    phone: string;
    enrolledAt: string;
}

interface Session {
    id: string;
    title: string;
    description: string | null;
    date: string;
    type: "SCHEDULED" | "COMPENSATORY";
    attendances: any[];
}

interface ClassData {
    id: string;
    name: string;
    description: string | null;
    students: Student[];
    pastSessions: Session[];
    upcomingSessions: Session[];
}

export default function TeacherClassDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const { data: session } = useSession();
    const router = useRouter();
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showNewSession, setShowNewSession] = useState(false);
    const [showAttendance, setShowAttendance] = useState<string | null>(null);
    const [attendanceData, setAttendanceData] = useState<Record<string, string | null>>({});
    const [editingSession, setEditingSession] = useState<Session | null>(null);

    // New session form
    const [newSession, setNewSession] = useState({
        title: "",
        description: "",
        date: "",
        fileUrl: "",
        fileTitle: "",
    });

    useEffect(() => {
        if (
            session?.user?.role !== "TEACHER" &&
            session?.user?.role !== "ADMIN"
        ) {
            router.push("/dashboard");
            return;
        }
        fetchClassData();
    }, [session, router, params.id]);

    const fetchClassData = async () => {
        try {
            const response = await fetch(`/api/classes/${params.id}`);
            const data = await response.json();
            if (response.ok) {
                setClassData(data.class);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const contents = newSession.fileUrl
                ? [
                    {
                        title: newSession.fileTitle || "فایل جلسه",
                        fileUrl: newSession.fileUrl,
                        fileType: "pdf",
                    },
                ]
                : undefined;

            const response = await fetch("/api/sessions/compensatory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classId: params.id,
                    title: newSession.title,
                    description: newSession.description,
                    date: newSession.date,
                    contents,
                }),
            });

            if (response.ok) {
                alert("جلسه با موفقیت ایجاد شد");
                setShowNewSession(false);
                setNewSession({
                    title: "",
                    description: "",
                    date: "",
                    fileUrl: "",
                    fileTitle: "",
                });
                fetchClassData();
            } else {
                const data = await response.json();
                alert(data.error || "خطا در ایجاد جلسه");
            }
        } catch (error) {
            alert("خطا در ایجاد جلسه");
        }
    };

    const handleMarkAttendance = async (sessionId: string) => {
        if (!classData) return;

        try {
            const records = classData.students.map((student) => ({
                studentId: student.id,
                status: attendanceData[student.id] || null,
            }));

            const response = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    attendanceData: records,
                }),
            });

            if (response.ok) {
                alert("حضور و غیاب ثبت شد");
                setShowAttendance(null);
                setAttendanceData({});
                fetchClassData();
            } else {
                alert("خطا در ثبت حضور و غیاب");
            }
        } catch (error) {
            alert("خطا در ثبت حضور و غیاب");
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm("آیا از حذف این جلسه اطمینان دارید؟")) return;

        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("جلسه با موفقیت حذف شد");
                fetchClassData();
            } else {
                alert("خطا در حذف جلسه");
            }
        } catch (error) {
            alert("خطا در حذف جلسه");
        }
    };

    const handleUpdateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSession) return;

        try {
            const response = await fetch(`/api/sessions/${editingSession.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editingSession.title,
                    description: editingSession.description,
                    date: editingSession.date,
                }),
            });

            if (response.ok) {
                alert("جلسه با موفقیت ویرایش شد");
                setEditingSession(null);
                fetchClassData();
            } else {
                alert("خطا در ویرایش جلسه");
            }
        } catch (error) {
            alert("خطا در ویرایش جلسه");
        }
    };

    const loadAttendanceForSession = (sessionId: string) => {
        if (!classData) return;

        const session = [...classData.pastSessions, ...classData.upcomingSessions].find(
            (s) => s.id === sessionId
        );

        if (session) {
            const data: Record<string, string | null> = {};
            session.attendances.forEach((att: any) => {
                data[att.studentId] = att.status;
            });
            setAttendanceData(data);
            setShowAttendance(sessionId);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
            </div>
        );
    }

    if (!classData) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                        {classData.name}
                    </h1>
                    {classData.description && (
                        <p className="text-[var(--muted-foreground)]">
                            {classData.description}
                        </p>
                    )}
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/teacher/classes">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 ml-2" />
                            بازگشت
                        </Button>
                    </Link>
                    <Button onClick={() => setShowNewSession(true)}>
                        <PlusCircle className="h-4 w-4 ml-2" />
                        جلسه جدید
                    </Button>
                </div>
            </div>

            {/* New Session Form */}
            {showNewSession && (
                <Card>
                    <CardHeader>
                        <CardTitle>ایجاد جلسه جبرانی</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">عنوان جلسه</label>
                                <Input
                                    value={newSession.title}
                                    onChange={(e) =>
                                        setNewSession({ ...newSession, title: e.target.value })
                                    }
                                    required
                                    placeholder="مثال: جلسه جبرانی ریاضی"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">توضیحات</label>
                                <Input
                                    value={newSession.description}
                                    onChange={(e) =>
                                        setNewSession({ ...newSession, description: e.target.value })
                                    }
                                    placeholder="توضیحات جلسه..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">تاریخ و زمان</label>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <PersianDatePicker
                                        value={newSession.date ? new Date(newSession.date) : undefined}
                                        onChange={(date) => {
                                            // Preserve time if exists
                                            const current = newSession.date ? new Date(newSession.date) : new Date();
                                            date.setHours(current.getHours());
                                            date.setMinutes(current.getMinutes());
                                            setNewSession({ ...newSession, date: date.toISOString() });
                                        }}
                                        minDate={new Date()}
                                    />
                                    <Input
                                        type="time"
                                        value={newSession.date ? new Date(newSession.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ""}
                                        onChange={(e) => {
                                            const [hours, minutes] = e.target.value.split(':').map(Number);
                                            const date = newSession.date ? new Date(newSession.date) : new Date();
                                            date.setHours(hours);
                                            date.setMinutes(minutes);
                                            setNewSession({ ...newSession, date: date.toISOString() });
                                        }}
                                        className="ltr"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">لینک فایل (اختیاری)</label>
                                <Input
                                    placeholder="https://..."
                                    value={newSession.fileUrl}
                                    onChange={(e) =>
                                        setNewSession({ ...newSession, fileUrl: e.target.value })
                                    }
                                />
                            </div>
                            {newSession.fileUrl && (
                                <div>
                                    <label className="text-sm font-medium">عنوان فایل</label>
                                    <Input
                                        value={newSession.fileTitle}
                                        onChange={(e) =>
                                            setNewSession({ ...newSession, fileTitle: e.target.value })
                                        }
                                    />
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button type="submit">ایجاد جلسه جبرانی</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowNewSession(false)}
                                >
                                    انصراف
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Students */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        دانش‌آموزان ({classData.students.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {classData.students.map((student) => (
                            <div
                                key={student.id}
                                className="flex items-center justify-between p-3 rounded border border-[var(--border)]"
                            >
                                <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-sm text-[var(--muted-foreground)]">
                                        {student.phone}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle>جلسات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...classData.upcomingSessions, ...classData.pastSessions].map(
                            (sess) => (
                                <div
                                    key={sess.id}
                                    className="p-4 rounded border border-[var(--border)]"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{sess.title}</h3>
                                                <SessionTypeBadge type={sess.type} />
                                            </div>
                                            {sess.description && (
                                                <p className="text-sm text-[var(--muted-foreground)]">
                                                    {sess.description}
                                                </p>
                                            )}
                                            <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                                {new Date(sess.date).toLocaleString("fa-IR")}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditingSession(sess)}
                                            >
                                                <Pencil className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteSession(sess.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => loadAttendanceForSession(sess.id)}
                                            >
                                                حضور و غیاب
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Edit Session Form */}
                                    {editingSession?.id === sess.id && (
                                        <div className="mt-4 p-4 bg-[var(--muted)] rounded border border-[var(--border)]">
                                            <h4 className="font-medium mb-3">ویرایش جلسه</h4>
                                            <form onSubmit={handleUpdateSession} className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium">عنوان جلسه</label>
                                                    <Input
                                                        value={editingSession.title}
                                                        onChange={(e) =>
                                                            setEditingSession({ ...editingSession, title: e.target.value })
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">توضیحات</label>
                                                    <Input
                                                        value={editingSession.description || ""}
                                                        onChange={(e) =>
                                                            setEditingSession({ ...editingSession, description: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">تاریخ و زمان</label>
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <PersianDatePicker
                                                            value={new Date(editingSession.date)}
                                                            onChange={(date) => {
                                                                const current = new Date(editingSession.date);
                                                                date.setHours(current.getHours());
                                                                date.setMinutes(current.getMinutes());
                                                                setEditingSession({ ...editingSession, date: date.toISOString() });
                                                            }}
                                                        />
                                                        <Input
                                                            type="time"
                                                            value={new Date(editingSession.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                            onChange={(e) => {
                                                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                                                const date = new Date(editingSession.date);
                                                                date.setHours(hours);
                                                                date.setMinutes(minutes);
                                                                setEditingSession({ ...editingSession, date: date.toISOString() });
                                                            }}
                                                            className="ltr"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="submit">ذخیره تغییرات</Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setEditingSession(null)}
                                                    >
                                                        انصراف
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {/* Attendance Form */}
                                    {showAttendance === sess.id && (
                                        <div className="mt-4 p-4 bg-[var(--muted)] rounded">
                                            <h4 className="font-medium mb-3">ثبت حضور و غیاب</h4>
                                            <div className="space-y-2 mb-4">
                                                {classData.students.map((student) => (
                                                    <div
                                                        key={student.id}
                                                        className="flex items-center justify-between p-2 bg-white rounded"
                                                    >
                                                        <span className="text-sm">{student.name}</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setAttendanceData({
                                                                        ...attendanceData,
                                                                        [student.id]: null,
                                                                    })
                                                                }
                                                                className={`p-2 rounded ${attendanceData[student.id] === null
                                                                    ? "bg-gray-200"
                                                                    : "bg-gray-50"
                                                                    }`}
                                                            >
                                                                <MinusCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setAttendanceData({
                                                                        ...attendanceData,
                                                                        [student.id]: "PRESENT",
                                                                    })
                                                                }
                                                                className={`p-2 rounded ${attendanceData[student.id] === "PRESENT"
                                                                    ? "bg-green-200"
                                                                    : "bg-green-50"
                                                                    }`}
                                                            >
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setAttendanceData({
                                                                        ...attendanceData,
                                                                        [student.id]: "ABSENT",
                                                                    })
                                                                }
                                                                className={`p-2 rounded ${attendanceData[student.id] === "ABSENT"
                                                                    ? "bg-red-200"
                                                                    : "bg-red-50"
                                                                    }`}
                                                            >
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMarkAttendance(sess.id)}
                                                >
                                                    ذخیره
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowAttendance(null);
                                                        setAttendanceData({});
                                                    }}
                                                >
                                                    انصراف
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
