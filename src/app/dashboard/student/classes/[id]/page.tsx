"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Calendar, Download, Users, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

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
  dueDate: string | null;
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
}

export default function ClassDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            <p className="text-[var(--muted-foreground)]">{classData.description}</p>
          )}
        </div>
        <Link href="/dashboard/student/classes">
          <Button variant="outline">بازگشت به لیست کلاس‌ها</Button>
        </Link>
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
                    <div className="space-y-2">
                      <p className="text-sm font-medium">تکالیف:</p>
                      <div className="grid gap-2">
                        {session.assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-2 rounded border border-[var(--border)]"
                          >
                            <p className="text-sm">{assignment.title}</p>
                            {assignment.dueDate && (
                              <span className="text-xs text-[var(--muted-foreground)]">
                                مهلت: {new Date(assignment.dueDate).toLocaleDateString("fa-IR")}
                              </span>
                            )}
                          </div>
                        ))}
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
  );
}
