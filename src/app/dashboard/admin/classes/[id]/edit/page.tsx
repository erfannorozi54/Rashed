"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Globe, Key, Lock, GraduationCap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ClassType = "PUBLIC" | "SEMI_PRIVATE" | "PRIVATE";

interface Teacher {
    id: string;
    name: string;
    phone: string;
}

const CLASS_TYPE_OPTIONS: { value: ClassType; label: string; description: string; icon: React.ReactNode }[] = [
    { value: "PUBLIC", label: "عمومی", description: "دانش‌آموزان می‌توانند ثبت‌نام کنند", icon: <Globe className="h-5 w-5" /> },
    { value: "SEMI_PRIVATE", label: "نیمه خصوصی", description: "نیاز به کد دعوت", icon: <Key className="h-5 w-5" /> },
    { value: "PRIVATE", label: "خصوصی", description: "فقط ادمین دانش‌آموز تعیین می‌کند", icon: <Lock className="h-5 w-5" /> },
];

export default function AdminEditClassPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classId } = use(params);
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [classType, setClassType] = useState<ClassType>("PUBLIC");
    const [maxCapacity, setMaxCapacity] = useState("");
    const [sessionDuration, setSessionDuration] = useState("90");
    const [sessionPrice, setSessionPrice] = useState("0");

    const formatPrice = (val: string) => {
        const num = val.replace(/\D/g, "");
        return num ? Number(num).toLocaleString() : "";
    };
    const rawPrice = (val: string) => val.replace(/\D/g, "") || "0";
    const [minSessionsToPay, setMinSessionsToPay] = useState("");
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);

    useEffect(() => {
        if (session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchClass();
        fetchTeachers();
    }, [session, router, classId]);

    const fetchClass = async () => {
        try {
            const res = await fetch(`/api/classes/${classId}`);
            const data = await res.json();
            if (res.ok) {
                const cls = data.class;
                setName(cls.name);
                setDescription(cls.description || "");
                setClassType(cls.classType);
                setMaxCapacity(cls.maxCapacity?.toString() || "");
                setSessionDuration(cls.sessionDuration?.toString() || "90");
                setSessionPrice(cls.sessionPrice?.toString() || "0");
                setMinSessionsToPay(
                    cls.minSessionsToPay !== null && cls.minSessionsToPay !== undefined
                        ? cls.minSessionsToPay.toString()
                        : ""
                );
                setSelectedTeacherIds(cls.teachers.map((t: any) => t.id));
            } else {
                alert(data.error || "خطا در دریافت اطلاعات");
                router.push(`/dashboard/admin/classes/${classId}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await fetch("/api/users?role=TEACHER");
            const data = await res.json();
            if (res.ok) setAllTeachers(data.users || []);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleTeacher = (id: string) => {
        setSelectedTeacherIds((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/classes/${classId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    classType,
                    maxCapacity: maxCapacity ? Number(maxCapacity) : null,
                    sessionDuration: Number(sessionDuration) || 90,
                    sessionPrice: Number(sessionPrice) || 0,
                    minSessionsToPay: minSessionsToPay !== "" ? Number(minSessionsToPay) : null,
                    teacherIds: selectedTeacherIds,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                router.push(`/dashboard/admin/classes/${classId}`);
            } else {
                alert(data.error || "خطا در ویرایش");
            }
        } catch (e) {
            alert("خطا در ویرایش");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="ویرایش کلاس" />

            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-1">ویرایش کلاس</h1>
                        <p className="text-[var(--muted-foreground)]">اطلاعات کلاس را ویرایش کنید</p>
                    </div>
                    <Link href={`/dashboard/admin/classes/${classId}`}>
                        <Button variant="outline">بازگشت</Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>اطلاعات پایه</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">نام کلاس *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">توضیحات (اختیاری)</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>نوع کلاس</Label>
                                <div className="grid sm:grid-cols-3 gap-3">
                                    {CLASS_TYPE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setClassType(opt.value)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none",
                                                classType === opt.value
                                                    ? "border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                                                    : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary-400)]"
                                            )}
                                        >
                                            {opt.icon}
                                            <span className="font-semibold text-sm">{opt.label}</span>
                                            <span className="text-xs opacity-70">{opt.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxCapacity">حداکثر ظرفیت (اختیاری)</Label>
                                    <Input
                                        id="maxCapacity"
                                        type="number"
                                        min="1"
                                        value={maxCapacity}
                                        onChange={(e) => setMaxCapacity(e.target.value)}
                                        placeholder="نامحدود"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sessionDuration">مدت هر جلسه (دقیقه)</Label>
                                    <Input
                                        id="sessionDuration"
                                        type="number"
                                        min="15"
                                        max="480"
                                        value={sessionDuration}
                                        onChange={(e) => setSessionDuration(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sessionPrice">هزینه هر جلسه</Label>
                                    <div className="relative">
                                        <Input
                                            id="sessionPrice"
                                            type="text"
                                            inputMode="numeric"
                                            value={formatPrice(sessionPrice)}
                                            onChange={(e) => setSessionPrice(rawPrice(e.target.value))}
                                            className="pl-16"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">تومان</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minSessionsToPay">حداقل جلسات برای پرداخت</Label>
                                    <Input
                                        id="minSessionsToPay"
                                        type="number"
                                        min="0"
                                        value={minSessionsToPay}
                                        onChange={(e) => setMinSessionsToPay(e.target.value)}
                                        placeholder="کل جلسات"
                                    />
                                    <p className="text-xs text-[var(--muted-foreground)]">۰ = رایگان | خالی = پرداخت کامل</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Teachers */}
                    <Card>
                        <CardHeader>
                            <CardTitle>معلمان</CardTitle>
                            <CardDescription>معلمان این کلاس را انتخاب کنید</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {/* Admin as teacher */}
                                {session?.user && (
                                    <button
                                        type="button"
                                        onClick={() => toggleTeacher(session.user.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border text-sm text-right transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none",
                                            selectedTeacherIds.includes(session.user.id)
                                                ? "border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                                                : "border-[var(--border)] bg-white hover:border-[var(--primary-400)]"
                                        )}
                                    >
                                        <GraduationCap className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{session.user.name} (شما)</span>
                                    </button>
                                )}
                                {allTeachers.map((teacher) => (
                                    <button
                                        key={teacher.id}
                                        type="button"
                                        onClick={() => toggleTeacher(teacher.id)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border text-sm text-right transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:outline-none",
                                            selectedTeacherIds.includes(teacher.id)
                                                ? "border-[var(--primary-600)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                                                : "border-[var(--border)] bg-white hover:border-[var(--primary-400)]"
                                        )}
                                    >
                                        <GraduationCap className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{teacher.name}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Link href={`/dashboard/admin/classes/${classId}`}>
                            <Button type="button" variant="outline">انصراف</Button>
                        </Link>
                        <Button type="submit" disabled={saving || !name.trim()}>
                            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
