"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LogOut, BookOpen, ChevronRight, ChevronDown, LayoutDashboard, Home, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    STUDENT: "دانشآموز",
};

// Auto-detect parent route from pathname
function getParentRoute(pathname: string, role?: string): string | null {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 2) return null; // Already at dashboard root
    
    // Remove last segment to get parent
    segments.pop();
    const parent = "/" + segments.join("/");
    
    // If parent is just /dashboard/role, return it
    if (role && parent === `/dashboard/${role.toLowerCase()}`) {
        return parent;
    }
    
    return parent;
}

export default function DashboardHeader({ title, backHref }: DashboardHeaderProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const role = session?.user?.role as string | undefined;
    const dashboardHref = role ? ROLE_DASHBOARD[role] : "/dashboard";
    const isOnDashboard = role ? pathname === ROLE_DASHBOARD[role] : false;
    
    // Smart back button: use provided backHref or auto-detect parent
    const effectiveBackHref = backHref || getParentRoute(pathname, role);

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
        <header className="bg-white/80 backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-4">

                    {/* ── Logo ───────────────────────── */}
                    <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity">
                        <Logo width={120} height={67} className="h-8 w-auto" />
                    </Link>

                    {/* ── Breadcrumb / Title ────────── */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {!isOnDashboard && effectiveBackHref && (
                            <>
                                <Link 
                                    href={dashboardHref}
                                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary-600)] transition-colors hidden sm:block"
                                >
                                    داشبورد
                                </Link>
                                <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] hidden sm:block" />
                            </>
                        )}
                        {title && (
                            <span className="text-sm font-medium text-[var(--foreground)] truncate">
                                {title}
                            </span>
                        )}
                    </div>

                    {/* ── Nav actions ─────────────────── */}
                    <div className="flex items-center gap-2 shrink-0">

                        {/* Back button - only show if not on dashboard */}
                        {!isOnDashboard && effectiveBackHref && (
                            <Link href={effectiveBackHref}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-1.5 hover:bg-[var(--muted)]"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    <span className="hidden sm:inline">بازگشت</span>
                                </Button>
                            </Link>
                        )}

                        {/* Dashboard shortcut - only show if not on dashboard */}
                        {!isOnDashboard && (
                            <Link href={dashboardHref}>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex items-center gap-1.5 border-[var(--primary-200)] text-[var(--primary-600)] hover:bg-[var(--primary-50)]"
                                >
                                    <Home className="h-4 w-4" />
                                    <span className="hidden md:inline">داشبورد</span>
                                </Button>
                            </Link>
                        )}

                        {/* Teacher blogs */}
                        {role === "TEACHER" && (
                            <Link href="/blogs">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="hidden lg:flex items-center gap-1.5 hover:bg-[var(--muted)]"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    بلاگها
                                </Button>
                            </Link>
                        )}

                        {/* Profile dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]"
                            >
                                <span className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary-700)] text-white flex items-center justify-center text-sm font-bold shrink-0 select-none shadow-md">
                                    {getInitials(session?.user?.name)}
                                </span>
                                <span className="text-sm font-medium hidden lg:inline-block max-w-[120px] truncate">
                                    {session?.user?.name}
                                </span>
                                <ChevronDown
                                    className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform hidden lg:block ${dropdownOpen ? "rotate-180" : ""}`}
                                />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl border border-[var(--border)] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* User info */}
                                    <div className="px-4 py-3 border-b border-[var(--border)]">
                                        <p className="font-semibold text-sm truncate">{session?.user?.name}</p>
                                        <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center gap-1.5">
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                            {role ? ROLE_LABEL[role] : ""}
                                        </p>
                                    </div>

                                    {/* Dashboard link */}
                                    <Link
                                        href={dashboardHref}
                                        onClick={() => setDropdownOpen(false)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                                    >
                                        <LayoutDashboard className="h-4 w-4 text-[var(--primary-600)]" />
                                        داشبورد
                                    </Link>

                                    {/* Blogs (teacher only) */}
                                    {role === "TEACHER" && (
                                        <Link
                                            href="/blogs"
                                            onClick={() => setDropdownOpen(false)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                                        >
                                            <BookOpen className="h-4 w-4 text-[var(--secondary-600)]" />
                                            بلاگها
                                        </Link>
                                    )}

                                    {/* Logout */}
                                    <div className="border-t border-[var(--border)] mt-2 pt-2">
                                        <button
                                            onClick={() => signOut({ callbackUrl: "/" })}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-2 w-[calc(100%-1rem)]"
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
