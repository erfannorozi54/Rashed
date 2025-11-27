"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/auth/login");
            return;
        }

        // Redirect based on role
        if (session.user.role === "ADMIN") {
            router.push("/dashboard/admin");
        } else if (session.user.role === "STUDENT") {
            router.push("/dashboard/student");
        } else if (session.user.role === "TEACHER") {
            router.push("/dashboard/teacher");
        }
    }, [session, status, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                <p className="mt-4 text-[var(--muted-foreground)]">در حال بارگذاری...</p>
            </div>
        </div>
    );
}
