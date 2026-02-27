"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import DashboardHeader from "@/components/layout/DashboardHeader";

interface Teacher {
    id: string;
    name: string;
    role: string;
}

export default function StudentTeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/teachers")
            .then((r) => r.json())
            .then((d) => setTeachers(d.teachers || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="اساتید" />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">اساتید</h1>
                    <p className="text-[var(--muted-foreground)]">مشاهده برنامه هفتگی اساتید</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                    </div>
                ) : teachers.length === 0 ? (
                    <p className="text-center text-[var(--muted-foreground)] py-8">هیچ استادی یافت نشد</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {teachers.map((t) => (
                            <Link key={t.id} href={`/dashboard/student/teachers/${t.id}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <GraduationCap className="h-5 w-5 text-[var(--secondary-600)]" />
                                            {t.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                            t.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                        }`}>
                                            {t.role === "ADMIN" ? "مدیر" : "استاد"}
                                        </span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
