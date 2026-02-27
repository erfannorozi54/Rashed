"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LogOut, BookOpen, ChevronLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

interface DashboardHeaderProps {
    title?: string;
}

const MAIN_DASHBOARD_PATHS = ["/dashboard/admin", "/dashboard/teacher", "/dashboard/student"];

export default function DashboardHeader({ title }: DashboardHeaderProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isMainPage = MAIN_DASHBOARD_PATHS.includes(pathname);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case "ADMIN": return "مدیر";
            case "TEACHER": return "معلم";
            case "STUDENT": return "دانش‌آموز";
            default: return "";
        }
    };

    const getInitials = (name?: string | null) => {
        if (!name) return "؟";
        const parts = name.trim().split(" ");
        return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
    };

    return (
        <header className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="shrink-0">
                        <Logo width={120} height={67} className="h-8 w-auto" />
                    </Link>

                    {/* Page title */}
                    {title && (
                        <span className="text-sm font-medium text-[var(--muted-foreground)] hidden md:block truncate">
                            {title}
                        </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Teacher blogs link */}
                        {session?.user?.role === "TEACHER" && (
                            <Link href="/blogs">
                                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1">
                                    <BookOpen className="h-4 w-4" />
                                    بلاگ‌ها
                                </Button>
                            </Link>
                        )}

                        {/* Back button — only on sub-pages */}
                        {!isMainPage && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(pathname.split("/").slice(0, -1).join("/") || "/dashboard")}
                                className="flex items-center gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">بازگشت</span>
                            </Button>
                        )}

                        {/* Profile dropdown */}
                        <div className="relative mr-1" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]"
                            >
                                <span className="h-8 w-8 rounded-full bg-[var(--primary-600)] text-white flex items-center justify-center text-sm font-bold shrink-0 select-none">
                                    {getInitials(session?.user?.name)}
                                </span>
                                <span className="text-sm font-medium hidden md:inline-block max-w-[120px] truncate">
                                    {session?.user?.name}
                                </span>
                                <ChevronDown
                                    className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform hidden md:block ${dropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl border border-[var(--border)] shadow-lg py-1 z-50">
                                    {/* User info header */}
                                    <div className="px-4 py-3 border-b border-[var(--border)]">
                                        <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                                            {session?.user?.name}
                                        </p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                            {getRoleLabel(session?.user?.role)}
                                        </p>
                                    </div>

                                    {/* Logout */}
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        خروج از حساب
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
