"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LogOut, BookOpen, ChevronRight, LayoutDashboard, Home, ArrowRight, Sparkles, User } from "lucide-react";
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

const ROLE_GRADIENT: Record<string, string> = {
    ADMIN: "from-red-500 via-red-600 to-rose-600",
    TEACHER: "from-blue-500 via-blue-600 to-indigo-600",
    STUDENT: "from-emerald-500 via-green-600 to-teal-600",
};

// Auto-detect parent route from pathname
function getParentRoute(pathname: string, role?: string): string | null {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 2) return null;
    segments.pop();
    const parent = "/" + segments.join("/");
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

    const roleGradient = role ? ROLE_GRADIENT[role] : "from-gray-500 to-gray-600";

    return (
        <header className="sticky top-0 z-50 border-b border-white/20 bg-gradient-to-b from-white/95 via-white/90 to-white/80 backdrop-blur-xl shadow-lg shadow-black/5">
            <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between gap-3 sm:gap-6">

                    {/* Left: Logo + Breadcrumb */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <Link href="/" className="shrink-0 hover:scale-105 transition-transform duration-200">
                            <Logo width={120} height={67} className="h-7 sm:h-9 w-auto drop-shadow-sm" />
                        </Link>

                        {/* Breadcrumb */}
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            {!isOnDashboard && effectiveBackHref ? (
                                <>
                                    <Link 
                                        href={dashboardHref}
                                        className="text-[var(--muted-foreground)] hover:text-[var(--primary-600)] transition-colors font-medium"
                                    >
                                        داشبورد
                                    </Link>
                                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                                    {title && (
                                        <span className="text-[var(--foreground)] font-semibold truncate max-w-[200px]">
                                            {title}
                                        </span>
                                    )}
                                </>
                            ) : (
                                title && (
                                    <span className="text-[var(--foreground)] font-semibold truncate">
                                        {title}
                                    </span>
                                )
                            )}
                        </div>

                        {/* Mobile title */}
                        {title && (
                            <span className="md:hidden text-sm font-semibold text-[var(--foreground)] truncate">
                                {title}
                            </span>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">

                        {/* Back button */}
                        {!isOnDashboard && effectiveBackHref && (
                            <Link href={effectiveBackHref}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="group relative overflow-hidden hover:bg-gradient-to-r hover:from-[var(--primary-50)] hover:to-[var(--primary-100)] border border-transparent hover:border-[var(--primary-200)] transition-all duration-300"
                                >
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    <span className="hidden sm:inline text-sm font-medium">بازگشت</span>
                                </Button>
                            </Link>
                        )}

                        {/* Dashboard shortcut */}
                        {!isOnDashboard && (
                            <Link href={dashboardHref}>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="group relative overflow-hidden bg-gradient-to-r from-[var(--primary-50)] to-[var(--primary-100)] border-[var(--primary-300)] text-[var(--primary-700)] hover:from-[var(--primary-100)] hover:to-[var(--primary-200)] hover:border-[var(--primary-400)] transition-all duration-300 shadow-sm"
                                >
                                    <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span className="hidden md:inline text-sm font-medium">داشبورد</span>
                                </Button>
                            </Link>
                        )}

                        {/* Teacher blogs */}
                        {role === "TEACHER" && (
                            <Link href="/blogs" className="hidden lg:block">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="group hover:bg-gradient-to-r hover:from-[var(--secondary-50)] hover:to-[var(--secondary-100)] border border-transparent hover:border-[var(--secondary-200)] transition-all duration-300"
                                >
                                    <BookOpen className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-medium">بلاگها</span>
                                </Button>
                            </Link>
                        )}

                        {/* Profile dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="group flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/60 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-500)] focus-visible:ring-offset-2"
                            >
                                {/* Avatar with animated gradient ring */}
                                <div className="relative">
                                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${roleGradient} opacity-20 group-hover:opacity-40 blur-sm transition-opacity duration-300`}></div>
                                    <div className={`relative h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br ${roleGradient} p-[2px] shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                                            <span className={`text-sm sm:text-base font-bold bg-gradient-to-br ${roleGradient} bg-clip-text text-transparent`}>
                                                {getInitials(session?.user?.name)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                                </div>

                                <span className="hidden lg:block text-sm font-semibold text-[var(--foreground)] max-w-[120px] truncate">
                                    {session?.user?.name}
                                </span>
                            </button>

                            {dropdownOpen && (
                                <div className="absolute left-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-black/10 py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200 overflow-hidden">
                                    {/* Gradient header */}
                                    <div className={`relative px-4 py-4 bg-gradient-to-br ${roleGradient} text-white overflow-hidden`}>
                                        <div className="absolute inset-0 bg-black/10"></div>
                                        <div className="relative flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{session?.user?.name}</p>
                                                <p className="text-xs opacity-90 flex items-center gap-1.5 mt-0.5">
                                                    <Sparkles className="h-3 w-3" />
                                                    {role ? ROLE_LABEL[role] : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div className="p-2 space-y-1">
                                        <Link
                                            href={dashboardHref}
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-gradient-to-r hover:from-[var(--primary-50)] hover:to-[var(--primary-100)] rounded-lg transition-all duration-200 group"
                                        >
                                            <LayoutDashboard className="h-4 w-4 text-[var(--primary-600)] group-hover:scale-110 transition-transform" />
                                            <span className="font-medium">داشبورد</span>
                                        </Link>

                                        {role === "TEACHER" && (
                                            <Link
                                                href="/blogs"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-gradient-to-r hover:from-[var(--secondary-50)] hover:to-[var(--secondary-100)] rounded-lg transition-all duration-200 group"
                                            >
                                                <BookOpen className="h-4 w-4 text-[var(--secondary-600)] group-hover:scale-110 transition-transform" />
                                                <span className="font-medium">بلاگها</span>
                                            </Link>
                                        )}
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-[var(--border)] mt-2 p-2">
                                        <button
                                            onClick={() => signOut({ callbackUrl: "/" })}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group font-medium"
                                        >
                                            <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
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
