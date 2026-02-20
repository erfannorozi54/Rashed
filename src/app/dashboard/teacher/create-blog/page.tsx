"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function CreateBlogPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [preview, setPreview] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/blogs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title, content }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "خطا در ایجاد بلاگ");
                return;
            }

            router.push("/blogs");
        } catch (error) {
            setError("خطا در ایجاد بلاگ. لطفاً دوباره تلاش کنید");
        } finally {
            setLoading(false);
        }
    };

    if (session?.user?.role !== "TEACHER") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>دسترسی غیرمجاز</CardTitle>
                        <CardDescription>
                            فقط معلمان می‌توانند بلاگ ایجاد کنند
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard">
                            <Button>بازگشت به داشبورد</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-6">
                    <Link href="/dashboard/teacher">
                        <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4 ml-2" />
                            بازگشت به داشبورد
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>ایجاد بلاگ جدید</CardTitle>
                        <CardDescription>
                            بلاگ خود را با پشتیبانی از Markdown و فرمول‌های ریاضی بنویسید
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-medium">
                                    عنوان بلاگ
                                </label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="عنوان بلاگ را وارد کنید"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="content" className="text-sm font-medium">
                                        محتوای بلاگ (Markdown)
                                    </label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPreview(!preview)}
                                    >
                                        {preview ? "ویرایش" : "پیش‌نمایش"}
                                    </Button>
                                </div>

                                {!preview ? (
                                    <textarea
                                        id="content"
                                        placeholder="محتوای بلاگ را با فرمت Markdown بنویسید...

مثال فرمول ریاضی:
$$
E = mc^2
$$

یا فرمول درون‌خطی: $a^2 + b^2 = c^2$
"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="flex min-h-[400px] w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                    />
                                ) : (
                                    <div className="min-h-[400px] w-full rounded-md border border-[var(--border)] bg-white px-4 py-3">
                                        <MarkdownRenderer content={content} />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" disabled={loading}>
                                    {loading ? "در حال ایجاد..." : "انتشار بلاگ"}
                                </Button>
                                <Link href="/dashboard/teacher">
                                    <Button type="button" variant="outline" disabled={loading}>
                                        انصراف
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                    <p className="font-medium mb-2">راهنمای نوشتن:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>از Markdown برای فرمت‌بندی استفاده کنید</li>
                        <li>برای فرمول‌های ریاضی از <code className="bg-blue-100 px-1 rounded">$$...$$</code> (بلوکی) یا <code className="bg-blue-100 px-1 rounded">$...$</code> (درون‌خطی) استفاده کنید</li>
                        <li>برای تصاویر از <code className="bg-blue-100 px-1 rounded">![alt](url)</code> استفاده کنید</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
