"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Trash2, Plus, GraduationCap, Pencil, X, Check } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PersianPriceInput from "@/components/ui/PersianPriceInput";

interface Specialization {
    id: string;
    subject: string;
    grade: string;
    content: string;
    price: number;
}

interface FormState {
    subject: string;
    grade: string;
    content: string;
    price: number | "";
}

const defaultForm: FormState = { subject: "", grade: "", content: "", price: "" };

export default function TeacherSpecializationsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState<FormState>(defaultForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<FormState>(defaultForm);

    useEffect(() => {
        if (session?.user?.role !== "TEACHER" && session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }
        fetchSpecs();
    }, [session, router]);

    const fetchSpecs = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teachers/${session.user.id}/specializations`);
            const data = await res.json();
            setSpecializations(data.specializations || []);
        } catch {
            setError("خطا در دریافت اطلاعات");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!form.subject.trim() || !form.grade.trim() || !form.content.trim()) {
            setError("لطفاً تمام فیلدها را پر کنید");
            return;
        }
        if (!form.price || Number(form.price) <= 0) {
            setError("قیمت الزامی است و باید بیشتر از صفر باشد");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/teachers/${session!.user.id}/specializations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: form.subject.trim(),
                    grade: form.grade.trim(),
                    content: form.content.trim(),
                    price: Number(form.price),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "خطا در افزودن تخصص");
                return;
            }
            setSpecializations((prev) => [...prev, data.specialization]);
            setForm(defaultForm);
            setShowAddForm(false);
        } catch {
            setError("خطا در افزودن تخصص");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (spec: Specialization) => {
        setEditingId(spec.id);
        setEditForm({ subject: spec.subject, grade: spec.grade, content: spec.content, price: spec.price });
        setError(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(defaultForm);
        setError(null);
    };

    const handleEdit = async (specId: string) => {
        if (!editForm.subject.trim() || !editForm.grade.trim() || !editForm.content.trim()) {
            setError("لطفاً تمام فیلدها را پر کنید");
            return;
        }
        if (!editForm.price || Number(editForm.price) <= 0) {
            setError("قیمت الزامی است و باید بیشتر از صفر باشد");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/teachers/${session!.user.id}/specializations/${specId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subject: editForm.subject.trim(),
                        grade: editForm.grade.trim(),
                        content: editForm.content.trim(),
                        price: Number(editForm.price),
                    }),
                }
            );
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "خطا در ویرایش تخصص");
                return;
            }
            setSpecializations((prev) =>
                prev.map((s) => (s.id === specId ? data.specialization : s))
            );
            setEditingId(null);
            setEditForm(defaultForm);
        } catch {
            setError("خطا در ویرایش تخصص");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (specId: string) => {
        if (!confirm("آیا از حذف این تخصص مطمئن هستید؟")) return;
        try {
            const res = await fetch(
                `/api/teachers/${session!.user.id}/specializations/${specId}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                setSpecializations((prev) => prev.filter((s) => s.id !== specId));
            }
        } catch {
            setError("خطا در حذف تخصص");
        }
    };

    if (session?.user?.role !== "TEACHER" && session?.user?.role !== "ADMIN") {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="تخصص‌های من" backHref="/dashboard/teacher" />
            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">تخصص‌های من</h1>
                        <p className="text-[var(--muted-foreground)]">
                            دروس و محتوایی که برای رزرو جلسه خصوصی ارائه می‌دهید
                        </p>
                    </div>
                    {!showAddForm && (
                        <Button
                            onClick={() => {
                                setShowAddForm(true);
                                setEditingId(null);
                                setError(null);
                            }}
                            className="shrink-0"
                        >
                            <Plus className="h-4 w-4 ml-2" />
                            افزودن تخصص
                        </Button>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Add form */}
                {showAddForm && (
                    <Card className="mb-6 border-[var(--primary-600)]">
                        <CardHeader>
                            <CardTitle className="text-base">افزودن تخصص جدید</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="add-subject">درس</Label>
                                    <Input
                                        id="add-subject"
                                        placeholder="مثال: ریاضی"
                                        value={form.subject}
                                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="add-grade">پایه</Label>
                                    <Input
                                        id="add-grade"
                                        placeholder="مثال: یازدهم"
                                        value={form.grade}
                                        onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="add-content">عنوان تدریس</Label>
                                <Input
                                    id="add-content"
                                    placeholder="مثال: ریاضی کنکور یازدهم"
                                    value={form.content}
                                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="add-price">قیمت هر جلسه (تومان) *</Label>
                                <PersianPriceInput
                                    id="add-price"
                                    value={form.price}
                                    onChange={(v) => setForm((f) => ({ ...f, price: v }))}
                                    placeholder="مثال: ۵۰۰٬۰۰۰"
                                />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button onClick={handleAdd} disabled={saving}>
                                    {saving ? "در حال ذخیره..." : "ذخیره"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setForm(defaultForm);
                                        setError(null);
                                    }}
                                >
                                    انصراف
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                    </div>
                ) : specializations.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50 text-[var(--muted-foreground)]" />
                            <p className="text-[var(--muted-foreground)]">هنوز تخصصی تعریف نکرده‌اید</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {specializations.map((spec) =>
                            editingId === spec.id ? (
                                <Card key={spec.id} className="border-[var(--primary-600)]">
                                    <CardContent className="pt-4 space-y-3">
                                        <p className="font-medium text-sm">ویرایش تخصص</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label>درس</Label>
                                                <Input
                                                    placeholder="مثال: ریاضی"
                                                    value={editForm.subject}
                                                    onChange={(e) =>
                                                        setEditForm((f) => ({ ...f, subject: e.target.value }))
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>پایه</Label>
                                                <Input
                                                    placeholder="مثال: یازدهم"
                                                    value={editForm.grade}
                                                    onChange={(e) =>
                                                        setEditForm((f) => ({ ...f, grade: e.target.value }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>عنوان تدریس</Label>
                                            <Input
                                                placeholder="مثال: ریاضی کنکور یازدهم"
                                                value={editForm.content}
                                                onChange={(e) =>
                                                    setEditForm((f) => ({ ...f, content: e.target.value }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>قیمت هر جلسه (تومان) *</Label>
                                            <PersianPriceInput
                                                value={editForm.price}
                                                onChange={(v) =>
                                                    setEditForm((f) => ({ ...f, price: v }))
                                                }
                                                placeholder="مثال: ۵۰۰٬۰۰۰"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleEdit(spec.id)} disabled={saving}>
                                                <Check className="h-4 w-4 ml-1" />
                                                {saving ? "در حال ذخیره..." : "ذخیره"}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={cancelEdit}>
                                                <X className="h-4 w-4 ml-1" />
                                                انصراف
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card key={spec.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <p className="font-medium">{spec.content}</p>
                                                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                                    <span>درس: {spec.subject}</span>
                                                    <span>•</span>
                                                    <span>پایه: {spec.grade}</span>
                                                    <span>•</span>
                                                    <span className="font-medium text-[var(--primary-700)]">
                                                        {spec.price.toLocaleString("fa-IR")} تومان
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => startEdit(spec)}
                                                    className="text-[var(--muted-foreground)] hover:text-[var(--primary-600)] hover:bg-blue-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(spec.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
