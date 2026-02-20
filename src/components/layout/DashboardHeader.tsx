"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { GraduationCap, LogOut, Home, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardHeaderProps {
    title?: string;
    showHomeButton?: boolean;
}

export default function DashboardHeader({ title = "موسسه ریاضی رشد", showHomeButton = true }: DashboardHeaderProps) {
    const { data: session } = useSession();
    const pathname = usePathname();

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case "ADMIN":
                return "مدیر";
            case "TEACHER":
                return "معلم";
            case "STUDENT":
                return "دانش‌آموز";
            default:
                return "";
        }
    };

    return (
        <header className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-[var(--primary-600)]" />
                        <span className="text-xl font-bold hidden md:inline-block">{title}</span>
                        <span className="text-xl font-bold md:hidden">رشد</span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {showHomeButton && (
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="hidden md:flex">
                                    <Home className="h-4 w-4 ml-2" />
                                    خانه
                                </Button>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Home className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}

                        {/* Role-specific links could go here */}
                        {session?.user?.role === "TEACHER" && (
                            <Link href="/blogs">
                                <Button variant="ghost" size="sm" className="hidden md:flex">
                                    <BookOpen className="h-4 w-4 ml-2" />
                                    بلاگ‌ها
                                </Button>
                            </Link>
                        )}

                        <div className="flex items-center gap-2 border-r border-[var(--border)] pr-4 mr-2">
                            <span className="text-sm text-[var(--muted-foreground)] hidden md:inline-block">
                                {session?.user?.name} {session?.user?.role && `(${getRoleLabel(session.user.role)})`}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <LogOut className="h-4 w-4 md:ml-2" />
                                <span className="hidden md:inline">خروج</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
