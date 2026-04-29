"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { ArrowRight, LogIn, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

interface PublicHeaderProps {
    title?: string;
    backHref?: string;
}

const ROLE_DASHBOARD: Record<string, string> = {
    ADMIN: "/dashboard/admin",
    TEACHER: "/dashboard/teacher",
    STUDENT: "/dashboard/student",
};

export default function PublicHeader({ title, backHref = "/" }: PublicHeaderProps) {
    const { data: session } = useSession();
    const role = session?.user?.role as string | undefined;
    const dashboardHref = role ? ROLE_DASHBOARD[role] : "/dashboard";

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center justify-between gap-4">
                    
                    {/* Logo */}
                    <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity">
                        <Logo width={120} height={67} className="h-6 sm:h-8 w-auto" />
                    </Link>

                    {/* Title */}
                    {title && (
                        <h1 className="text-sm sm:text-lg font-semibold text-[var(--foreground)] flex-1 truncate">
                            {title}
                        </h1>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Back button */}
                        <Link href={backHref}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 hover:bg-[var(--muted)] px-2 sm:px-3"
                            >
                                <ArrowRight className="h-4 w-4" />
                                <span className="hidden sm:inline text-sm">بازگشت</span>
                            </Button>
                        </Link>

                        {/* Login or Dashboard */}
                        {session ? (
                            <Link href={dashboardHref}>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-1.5 border-[var(--primary-200)] text-[var(--primary-600)] hover:bg-[var(--primary-50)] px-2 sm:px-3"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span className="hidden sm:inline text-sm">داشبورد</span>
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/auth/login">
                                <Button 
                                    size="sm"
                                    className="flex items-center gap-1.5 px-2 sm:px-3"
                                >
                                    <LogIn className="h-4 w-4" />
                                    <span className="text-sm">ورود</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
