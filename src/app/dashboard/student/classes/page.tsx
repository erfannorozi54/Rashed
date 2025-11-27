"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { BookOpen, Calendar, Users, FileText } from "lucide-react";
import Link from "next/link";

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
    fetchClasses();
  }, [session, router]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
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

  if (session?.user?.role !== "STUDENT") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          کلاس‌های من
        </h2>
        <p className="text-[var(--muted-foreground)]">
          لیست کلاس‌هایی که در آن‌ها ثبت‌نام کرده‌اید
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)] mb-2">
              هنوز در هیچ کلاسی ثبت‌نام نکرده‌اید
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              برای ثبت‌نام در کلاس‌ها با مدیر مدرسه تماس بگیرید
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[var(--primary-600)]" />
                  {cls.name}
                </CardTitle>
                {cls.description && (
                  <CardDescription>{cls.description}</CardDescription>
                )}
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
                    <span>
                      آخرین جلسه:{" "}
                      {new Date(cls.latestSession.date).toLocaleDateString(
                        "fa-IR"
                      )}
                    </span>
                  </div>
                )}

                <Link href={`/dashboard/student/classes/${cls.id}`}>
                  <Button className="w-full">
                    <FileText className="h-4 w-4 ml-2" />
                    مشاهده جزئیات
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
