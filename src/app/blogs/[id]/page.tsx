"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { GraduationCap, Calendar, User, ArrowRight } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface Blog {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: {
        name: string;
    };
}

export default function BlogDetailPage() {
    const params = useParams();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchBlog(params.id as string);
        }
    }, [params.id]);

    const fetchBlog = async (id: string) => {
        try {
            const response = await fetch(`/api/blogs?id=${id}`);
            const data = await response.json();
            setBlog(data.blog);
        } catch (error) {
            console.error("Error fetching blog:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                    <p className="mt-4 text-[var(--muted-foreground)]">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-[var(--muted-foreground)]">بلاگ یافت نشد</p>
                        <Link href="/blogs">
                            <Button className="mt-4">بازگشت به لیست بلاگ‌ها</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--primary-50)] via-white to-[var(--secondary-50)]">
            {/* Header */}
            <nav className="border-b border-[var(--border)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <GraduationCap className="h-8 w-8 text-[var(--primary-600)]" />
                            <span className="text-xl font-bold text-[var(--foreground)]">
                                موسسه ریاضی رشد
                            </span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/blogs">
                                <Button variant="ghost">بلاگ‌ها</Button>
                            </Link>
                            <Link href="/">
                                <Button variant="ghost">صفحه اصلی</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-6">
                    <Link href="/blogs">
                        <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4 ml-2" />
                            بازگشت به لیست بلاگ‌ها
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl md:text-4xl mb-4">
                            {blog.title}
                        </CardTitle>
                        <div className="flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
                            <span className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {blog.author.name}
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(blog.createdAt).toLocaleDateString("fa-IR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <MarkdownRenderer content={blog.content} />
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <Link href="/blogs">
                        <Button variant="outline">مشاهده بلاگ‌های بیشتر</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
