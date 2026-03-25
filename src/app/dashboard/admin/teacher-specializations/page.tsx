"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Trash2, Plus, ChevronDown, ChevronUp, GraduationCap, Pencil, X, Check } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PersianPriceInput from "@/components/ui/PersianPriceInput";

interface Specialization {
    id: string;
    subject: string;
    grade: string;
    content: string;
    price: number;
    teacher: { id: string; name: string };
}

interface Teacher {
    id: string;
    name: string;
    role: string;
}

interface FormState {
    subject: string;
    grade: string;
    content: string;
    price: number | "";
}

const defaultForm: FormState = { subject: "", grade: "", content: "", price: "" };

export default function TeacherSpecializationsPage() {
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
    const [showFormFor, setShowFormFor] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(defaultForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<FormState>(defaultForm);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [specsRes, teachersRes] = await Promise.all([
                fetch("/api/admin/teacher-specializations"),
                fetch("/api/teachers"),
            ]);
            const specsData = await specsRes.json();
            const teachersData = await teachersRes.json();
            setSpecializations(specsData.specializations || []);
            setTeachers(teachersData.teachers || []);
        } catch {
            setError("خطا در دریافت اطلاعات");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (teacherId: string) => {
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
            const res = await fetch("/api/admin/teacher-specializations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherId,
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
            setSpecializations((prev) => [data.specialization, ...prev]);
            setForm(defaultForm);
            setShowFormFor(null);
        } catch {
            setError("خطا در افزودن تخصص");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (spec: Specialization) => {
        setEditingId(spec.id);
        setEditForm({
            subject: spec.subject,
            grade: spec.grade,
            content: spec.content,
            price: spec.price,
        });
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
            const res = await fetch(`/api/admin/teacher-specializations/${specId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: editForm.subject.trim(),
                    grade: editForm.grade.trim(),
                    content: editForm.content.trim(),
                    price: Number(editForm.price),
                }),
            });
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

    const handleDelete = async (id: string) => {
        if (!confirm("آیا از حذف این تخصص مطمئن هستید؟")) return;
        try {
            const res = await fetch(`/api/admin/teacher-specializations/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setSpecializations((prev) => prev.filter((s) => s.id !== id));
            }
        } catch {
            setError("خطا در حذف تخصص");
        }
    };

    const teacherSpecs = (teacherId: string) =>
        specializations.filter((s) => s.teacher.id === teacherId);

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="تخصص‌های اساتید" backHref="/dashboard/admin" />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">تخصص‌های اساتید</h1>
                    <p className="text-[var(--muted-foreground)]">
                        تعریف دروس، پایه و محتوای تدریس هر استاد برای رزرو جلسه خصوصی
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                    </div>
                ) : teachers.length === 0 ? (
                    <p className="text-center text-[var(--muted-foreground)] py-8">هیچ استادی یافت نشد</p>
                ) : (
                    <div className="space-y-4">
                        {teachers.map((teacher) => {
                            const specs = teacherSpecs(teacher.id);
                            const isExpanded = expandedTeacher === teacher.id;
                            const isAddingFor = showFormFor === teacher.id;

                            return (
                                <Card key={teacher.id}>
                                    <CardHeader
                                        className="cursor-pointer select-none"
                                        onClick={() =>
                                            setExpandedTeacher(isExpanded ? null : teacher.id)
                                        }
                                    >
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-5 w-5 text-[var(--secondary-600)]" />
                                                <span>{teacher.name}</span>
                                                <span className="text-xs font-normal text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                                                    {specs.length} تخصص
                                                </span>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                                            )}
                                        </CardTitle>
                                    </CardHeader>

                                    {isExpanded && (
                                        <CardContent className="space-y-4 pt-0">
                                            {/* Existing specs */}
                                            {specs.length === 0 ? (
                                                <p className="text-sm text-[var(--muted-foreground)]">
                                                    هنوز تخصصی تعریف نشده است.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {specs.map((spec) =>
                                                        editingId === spec.id ? (
                                                            /* Inline edit form */
                                                            <div
                                                                key={spec.id}
                                                                className="border border-[var(--primary-600)] rounded-lg p-4 space-y-3"
                                                            >
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
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleEdit(spec.id)}
                                                                        disabled={saving}
                                                                    >
                                                                        <Check className="h-4 w-4 ml-1" />
                                                                        {saving ? "در حال ذخیره..." : "ذخیره"}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={cancelEdit}
                                                                    >
                                                                        <X className="h-4 w-4 ml-1" />
                                                                        انصراف
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Spec row */
                                                            <div
                                                                key={spec.id}
                                                                className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg"
                                                            >
                                                                <div className="space-y-0.5">
                                                                    <p className="font-medium text-sm">{spec.content}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                                                        <span>درس: {spec.subject}</span>
                                                                        <span>•</span>
                                                                        <span>پایه: {spec.grade}</span>
                                                                        <span>•</span>
                                                                        <span>
                                                                            {spec.price > 0
                                                                                ? `${spec.price.toLocaleString("fa-IR")} تومان`
                                                                                : "رایگان"}
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
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            {/* Add form */}
                                            {isAddingFor ? (
                                                <div className="border border-[var(--border)] rounded-lg p-4 space-y-3">
                                                    <p className="font-medium text-sm">افزودن تخصص جدید</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label htmlFor={`subject-${teacher.id}`}>درس</Label>
                                                            <Input
                                                                id={`subject-${teacher.id}`}
                                                                placeholder="مثال: ریاضی"
                                                                value={form.subject}
                                                                onChange={(e) =>
                                                                    setForm((f) => ({ ...f, subject: e.target.value }))
                                                                }
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label htmlFor={`grade-${teacher.id}`}>پایه</Label>
                                                            <Input
                                                                id={`grade-${teacher.id}`}
                                                                placeholder="مثال: یازدهم"
                                                                value={form.grade}
                                                                onChange={(e) =>
                                                                    setForm((f) => ({ ...f, grade: e.target.value }))
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`content-${teacher.id}`}>عنوان تدریس</Label>
                                                        <Input
                                                            id={`content-${teacher.id}`}
                                                            placeholder="مثال: ریاضی کنکور یازدهم"
                                                            value={form.content}
                                                            onChange={(e) =>
                                                                setForm((f) => ({ ...f, content: e.target.value }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`price-${teacher.id}`}>قیمت هر جلسه (تومان) *</Label>
                                                        <PersianPriceInput
                                                            id={`price-${teacher.id}`}
                                                            value={form.price}
                                                            onChange={(v) => setForm((f) => ({ ...f, price: v }))}
                                                            placeholder="مثال: ۵۰۰٬۰۰۰"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleAdd(teacher.id)}
                                                            disabled={saving}
                                                            size="sm"
                                                        >
                                                            {saving ? "در حال ذخیره..." : "ذخیره"}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setShowFormFor(null);
                                                                setForm(defaultForm);
                                                                setError(null);
                                                            }}
                                                        >
                                                            انصراف
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setShowFormFor(teacher.id);
                                                        setForm(defaultForm);
                                                        setEditingId(null);
                                                        setError(null);
                                                    }}
                                                    className="gap-1"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    افزودن تخصص
                                                </Button>
                                            )}
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
