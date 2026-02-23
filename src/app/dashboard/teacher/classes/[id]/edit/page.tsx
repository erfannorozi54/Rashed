"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Globe, Key, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ClassType = "PUBLIC" | "SEMI_PRIVATE" | "PRIVATE";

const CLASS_TYPE_OPTIONS: { value: ClassType; label: string; description: string; icon: React.ReactNode }[] = [
    { value: "PUBLIC", label: "عمومی", description: "دانش‌آموزان می‌توانند ثبت‌نام کنند", icon: <Globe className="h-5 w-5" /> },
    { value: "SEMI_PRIVATE", label: "نیمه خصوصی", description: "نیاز به کد دعوت", icon: <Key className="h-5 w-5" /> },
    { value: "PRIVATE", label: "خصوصی", description: "فقط ادمین دانش‌آموز تعیین می‌کند", icon: <Lock className="h-5 w-5" /> },
];

export default function TeacherEditClassPage({ params }: { params: { id: string } }) {
    const { id: classId } = params;
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

    useEffect(() => {
        if (
            session?.user?.role !== "TEACHER" &&
            session?.user?.role !== "ADMIN"
        ) {
            router.push("/dashboard");
            return;
        }
        fetchClass();
    }, [session, router, classId]);

    const fetchClass = async () => {
        try {
            const res = await fetch(`/api/classes/${classId}`);
            const data = await res.json();
            if (res.ok) {
                const cls = data.class;
                // Verify this teacher teaches this class
                if (
                    session?.user?.role === "TEACHER" &&
                    !cls.teachers.some((t: any) => t.id === session.user.id)
                ) {
                    router.push("/dashboard/teacher/classes");
                    return;
                }
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
            } else {
                alert(data.error || "خطا در دریافت اطلاعات");
                router.push(`/dashboard/teacher/classes/${classId}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
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
                }),
            });
            const data = await res.json();
            if (res.ok) {
                router.push(`/dashboard/teacher/classes/${classId}`);
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
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-1">ویرایش کلاس</h1>
                    <p className="text-[var(--muted-foreground)]">اطلاعات کلاس را ویرایش کنید</p>
                </div>
                <Link href={`/dashboard/teacher/classes/${classId}`}>
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

                <div className="flex justify-end gap-4">
                    <Link href={`/dashboard/teacher/classes/${classId}`}>
                        <Button type="button" variant="outline">انصراف</Button>
                    </Link>
                    <Button type="submit" disabled={saving || !name.trim()}>
                        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
