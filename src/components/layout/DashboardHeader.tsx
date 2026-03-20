"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LogOut, BookOpen, ChevronRight, ChevronDown, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

interface DashboardHeaderProps {
    title?: string;
    backHref?: string;
}

const ROLE_DASHBOARD: Record<string, string> = {
    ADMIN: "/dashboard/admin",
    TEACHER: "/dashboard/teacher",
    STUDENT: "/dashboard/student",
};

const ROLE_LABEL: Record<string, string> = {
    ADMIN: "مدیر",
    TEACHER: "معلم",
    STUDENT: "دانش‌آموز",
};

export default function DashboardHeader({ title, backHref }: DashboardHeaderProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const role = session?.user?.role as string | undefined;
    const dashboardHref = role ? ROLE_DASHBOARD[role] : "/dashboard";
    const isOnDashboard = role ? pathname === ROLE_DASHBOARD[role] : false;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const getInitials = (name?: string | null) => {
        if (!name) return "؟";
        const parts = name.trim().split(" ");
        return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
    };

    return (
        <header className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-3">

                    {/* ── Logo ───────────────────────── */}
                    <Link href="/" className="shrink-0">
                        <Logo width={120} height={67} className="h-8 w-auto" />
                    </Link>

                    {/* ── Page title (desktop) ────────── */}
                    {title && (
                        <span className="text-sm text-[var(--muted-foreground)] hidden md:block truncate flex-1">
                            {title}
                        </span>
                    )}

                    {/* ── Spacer ──────────────────────── */}
                    <div className="flex-1" />

                    {/* ── Nav actions ─────────────────── */}
                    <div className="flex items-center gap-1 shrink-0">

                        {/* Teacher blogs */}
                        {role === "TEACHER" && (
                            <Link href="/blogs">
                                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1.5">
                                    <BookOpen className="h-4 w-4" />
                                    بلاگ‌ها
                                </Button>
                            </Link>
                        )}

                        {/* Back button */}
                        {!isOnDashboard && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => backHref ? router.push(backHref) : router.back()}
                                className="flex items-center gap-1"
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="hidden sm:inline">بازگشت</span>
                            </Button>
                        )}

                        {/* Dashboard shortcut */}
                        {!isOnDashboard && (
                            <Link href={dashboardHref}>
                                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span className="hidden sm:inline">داشبورد</span>
                                </Button>
                            </Link>
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
                                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl border border-[var(--border)] shadow-lg py-1 z-50">
                                    {/* User info */}
                                    <div className="px-4 py-3 border-b border-[var(--border)]">
                                        <p className="font-semibold text-sm truncate">{session?.user?.name}</p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                                            {role ? ROLE_LABEL[role] : ""}
                                        </p>
                                    </div>

                                    {/* Dashboard link */}
                                    <Link
                                        href={dashboardHref}
                                        onClick={() => setDropdownOpen(false)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                                    >
                                        <LayoutDashboard className="h-4 w-4 text-[var(--primary-600)]" />
                                        داشبورد
                                    </Link>

                                    {/* Blogs (teacher only) */}
                                    {role === "TEACHER" && (
                                        <Link
                                            href="/blogs"
                                            onClick={() => setDropdownOpen(false)}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                                        >
                                            <BookOpen className="h-4 w-4 text-[var(--secondary-600)]" />
                                            بلاگ‌ها
                                        </Link>
                                    )}

                                    {/* Logout */}
                                    <div className="border-t border-[var(--border)] mt-1 pt-1">
                                        <button
                                            onClick={() => signOut({ callbackUrl: "/" })}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            خروج از حساب
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
