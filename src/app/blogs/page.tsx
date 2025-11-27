"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GraduationCap, Calendar, User } from "lucide-react";

interface Blog {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: {
        name: string;
    };
}

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const response = await fetch("/api/blogs");
            const data = await response.json();
            setBlogs(data.blogs || []);
        } catch (error) {
            console.error("Error fetching blogs:", error);
        } finally {
            setLoading(false);
        }
    };

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
                            <Link href="/">
                                <Button variant="ghost">صفحه اصلی</Button>
                            </Link>
                            <Link href="/auth/login">
                                <Button variant="outline">ورود</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-4">
                        بلاگ‌های آموزشی
                    </h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        مقالات و آموزش‌های ریاضی از اساتید موسسه رشد
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                        <p className="mt-4 text-[var(--muted-foreground)]">در حال بارگذاری...</p>
                    </div>
                ) : blogs.length === 0 ? (
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="text-center py-12">
                            <p className="text-[var(--muted-foreground)]">
                                هنوز بلاگی منتشر نشده است
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                        {blogs.map((blog) => (
                            <Link key={blog.id} href={`/blogs/${blog.id}`}>
                                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                                    <CardHeader>
                                        <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-4 text-xs mt-2">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {blog.author.name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(blog.createdAt).toLocaleDateString("fa-IR")}
                                            </span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-3">
                                            {blog.content.substring(0, 150)}...
                                        </p>
                                        <Button variant="ghost" size="sm" className="mt-4 p-0">
                                            ادامه مطلب ←
                                        </Button>
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
