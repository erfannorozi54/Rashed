"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, Calendar, Download, Users, FileText, Clock, CheckCircle, XCircle, CreditCard, Upload, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
  enrolledAt: string;
}

interface SessionContent {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  dueDate: string | null;
  submission?: {
    id: string;
    fileUrl: string | null;
    submittedAt: string;
    grade: number | null;
    feedback: string | null;
  } | null;
}

interface Attendance {
  id: string;
  status: string;
  markedAt: string;
}

interface Session {
  id: string;
  title: string;
  description: string | null;
  date: string;
  contents: SessionContent[];
  assignments: Assignment[];
  attendances: Attendance[];
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  teachers: Teacher[];
  students: Student[];
  pastSessions: Session[];
  upcomingSessions: Session[];
  totalSessions: number;
  createdAt: string;
  sessionPrice?: number;
  enrollmentStatus?: "PENDING_PAYMENT" | "ENROLLED" | "CANCELLED";
  paidAmount?: number;
  payment?: { id: string; amount: number; status: string } | null;
}

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.role !== "STUDENT") {
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
      } else {
        alert(data.error || "خطا در دریافت اطلاعات کلاس");
        router.push("/dashboard/student/classes");
      }
    } catch (error) {
      console.error("Error fetching class data:", error);
      alert("خطا در دریافت اطلاعات کلاس");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (assignmentId: string, file: File) => {
    setUploadingAssignmentId(assignmentId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignmentId", assignmentId);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("پاسخ با موفقیت ارسال شد");
        fetchClassData();
      } else {
        const data = await response.json();
        alert(data.error || "خطا در ارسال پاسخ");
      }
    } catch (error) {
      console.error("Error uploading submission:", error);
      alert("خطا در ارسال پاسخ");
    } finally {
      setUploadingAssignmentId(null);
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
    <div className="min-h-screen bg-[var(--muted)]">
      <DashboardHeader title={classData.name} backHref="/dashboard/student/classes" />
      <main className="container mx-auto px-4 py-8">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            {classData.name}
          </h1>
          {classData.description && (
            <p className="text-[var(--muted-foreground)]">{classData.description}</p>
          )}
        </div>
      </div>

      {/* Class Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">اساتید</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classData.teachers.map((teacher) => (
                <div key={teacher.id} className="text-sm">
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-[var(--muted-foreground)] text-xs">{teacher.phone}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">تعداد دانش‌آموزان</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{classData.students.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">تعداد جلسات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{classData.totalSessions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Status */}
      {classData.enrollmentStatus && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  classData.enrollmentStatus === "ENROLLED" ? "bg-green-100 text-green-700" :
                  classData.enrollmentStatus === "PENDING_PAYMENT" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-600"
                )}>
                  {classData.enrollmentStatus === "ENROLLED" ? "ثبت‌نام شده" :
                   classData.enrollmentStatus === "PENDING_PAYMENT" ? "در انتظار پرداخت" : "لغو شده"}
                </span>
                {classData.paidAmount !== undefined && classData.paidAmount > 0 && (
                  <span className="text-sm text-[var(--muted-foreground)]">
                    پرداخت شده: {classData.paidAmount.toLocaleString("fa-IR")} تومان
                  </span>
                )}
              </div>
              {classData.enrollmentStatus === "PENDING_PAYMENT" && classData.payment && (
                <Link href={`/payment/mock?payment_id=${classData.payment.id}`}>
                  <Button size="sm">
                    <CreditCard className="h-4 w-4 ml-1" />
                    پرداخت {classData.payment.amount.toLocaleString("fa-IR")} تومان
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      {classData.upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              جلسات آینده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classData.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]"
                >
                  <div>
                    <p className="font-medium">{session.title}</p>
                    {session.description && (
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {session.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Clock className="h-4 w-4" />
                    {new Date(session.date).toLocaleDateString("fa-IR")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            جلسات گذشته ({classData.pastSessions.length})
          </CardTitle>
          <CardDescription>محتوای آموزشی و تکالیف جلسات</CardDescription>
        </CardHeader>
        <CardContent>
          {classData.pastSessions.length === 0 ? (
            <p className="text-center text-[var(--muted-foreground)] py-8">
              هنوز جلسه‌ای برگزار نشده است
            </p>
          ) : (
            <div className="space-y-4">
              {classData.pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-lg border border-[var(--border)] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{session.title}</h3>
                      {session.description && (
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                          {session.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {session.attendances.length > 0 ? (
                        session.attendances[0].status === "PRESENT" ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            حاضر
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            غایب
                          </span>
                        )
                      ) : (
                        <span className="text-[var(--muted-foreground)]">-</span>
                      )}
                      <span className="text-[var(--muted-foreground)]">
                        {new Date(session.date).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                  </div>

                  {/* Session Contents */}
                  {session.contents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">محتوای جلسه:</p>
                      <div className="grid gap-2">
                        {session.contents.map((content) => (
                          <a
                            key={content.id}
                            href={content.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-[var(--primary-600)]" />
                              <div>
                                <p className="text-sm font-medium">{content.title}</p>
                                {content.description && (
                                  <p className="text-xs text-[var(--muted-foreground)]">
                                    {content.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Download className="h-4 w-4 text-[var(--muted-foreground)]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignments */}
                  {session.assignments.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">تکالیف:</p>
                      <div className="grid gap-3">
                        {session.assignments.map((assignment) => {
                          const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
                          const hasSubmission = !!assignment.submission;

                          return (
                            <div
                              key={assignment.id}
                              className={cn(
                                "p-3 rounded-lg border space-y-3",
                                hasSubmission ? "border-green-200 bg-green-50" : "border-[var(--border)]"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{assignment.title}</p>
                                  {assignment.description && (
                                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                      {assignment.description}
                                    </p>
                                  )}
                                  {assignment.dueDate && (
                                    <div className={cn(
                                      "flex items-center gap-1 text-xs mt-2",
                                      isOverdue && !hasSubmission ? "text-red-600" : "text-[var(--muted-foreground)]"
                                    )}>
                                      <Clock className="h-3 w-3" />
                                      <span>مهلت: {new Date(assignment.dueDate).toLocaleDateString("fa-IR")}</span>
                                      {isOverdue && !hasSubmission && <AlertCircle className="h-3 w-3 mr-1" />}
                                    </div>
                                  )}
                                </div>
                                {assignment.fileUrl && (
                                  <a
                                    href={assignment.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0"
                                  >
                                    <Button size="sm" variant="outline">
                                      <Download className="h-3 w-3 ml-1" />
                                      دانلود سوال
                                    </Button>
                                  </a>
                                )}
                              </div>

                              {hasSubmission ? (
                                <div className="p-2 bg-white rounded border border-green-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-green-700">
                                      <CheckCircle className="h-4 w-4" />
                                      <span>ارسال شده در {new Date(assignment.submission.submittedAt).toLocaleDateString("fa-IR")}</span>
                                    </div>
                                    {assignment.submission.fileUrl && (
                                      <a href={assignment.submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="ghost">
                                          <Download className="h-3 w-3 ml-1" />
                                          مشاهده پاسخ
                                        </Button>
                                      </a>
                                    )}
                                  </div>
                                  {assignment.submission.grade !== null && (
                                    <p className="text-sm mt-2">
                                      نمره: <span className="font-bold">{assignment.submission.grade}</span>
                                    </p>
                                  )}
                                  {assignment.submission.feedback && (
                                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                      بازخورد: {assignment.submission.feedback}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    id={`file-${assignment.id}`}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(assignment.id, file);
                                    }}
                                    disabled={uploadingAssignmentId === assignment.id}
                                  />
                                  <label htmlFor={`file-${assignment.id}`} className="flex-1">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="w-full"
                                      disabled={uploadingAssignmentId === assignment.id}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById(`file-${assignment.id}`)?.click();
                                      }}
                                    >
                                      {uploadingAssignmentId === assignment.id ? (
                                        <>در حال ارسال...</>
                                      ) : (
                                        <>
                                          <Upload className="h-3 w-3 ml-1" />
                                          ارسال پاسخ
                                        </>
                                      )}
                                    </Button>
                                  </label>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
