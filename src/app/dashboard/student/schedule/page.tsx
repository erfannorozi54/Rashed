"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PersianCalendar from "@/components/ui/PersianCalendar";
import moment from "moment-jalaali";
import { Loader2 } from "lucide-react";

export default function StudentSchedulePage() {
    const { data: session } = useSession();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

    useEffect(() => {
        if (session?.user?.role === "STUDENT") {
            fetchSessions(currentMonthDate);
        }
    }, [session, currentMonthDate]);

    const fetchSessions = async (date: Date) => {
        setLoading(true);
        try {
            // Calculate start and end of the Jalali month
            const mDate = moment(date);
            const startOfMonth = mDate.clone().startOf("jMonth").toDate();
            const endOfMonth = mDate.clone().endOf("jMonth").toDate();

            // Add buffer days to cover the full grid (prev/next month days visible in grid)
            const startDate = moment(startOfMonth).subtract(7, "days").toDate();
            const endDate = moment(endOfMonth).add(7, "days").toDate();

            const query = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            const res = await fetch(`/api/sessions?${query.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (date: Date) => {
        setCurrentMonthDate(date);
    };

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="برنامه کلاسی" />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                        تقویم آموزشی
                    </h1>
                    <p className="text-[var(--muted-foreground)]">
                        مشاهده برنامه کلاس‌ها و جلسات جبرانی
                    </p>
                </div>

                {loading && sessions.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[var(--primary-600)]" />
                    </div>
                ) : (
                    <PersianCalendar
                        sessions={sessions}
                        onMonthChange={handleMonthChange}
                    />
                )}
            </main>
        </div>
    );
}
