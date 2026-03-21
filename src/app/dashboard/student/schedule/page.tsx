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
    const [ready, setReady] = useState(false);
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

            const [sessionsRes, bookingsRes] = await Promise.all([
                fetch(`/api/sessions?${query.toString()}`),
                fetch("/api/private-bookings"),
            ]);

            const sessionsData = sessionsRes.ok ? await sessionsRes.json() : { sessions: [] };
            const bookingsData = bookingsRes.ok ? await bookingsRes.json() : { bookings: [] };

            const regularSessions = sessionsData.sessions || [];

            // Map confirmed/pending private bookings into calendar session format
            const privateBookings = (bookingsData.bookings || [])
                .filter((b: any) => b.status !== "CANCELLED")
                .filter((b: any) => {
                    const bookingDate = new Date(b.date);
                    return bookingDate >= startDate && bookingDate <= endDate;
                })
                .map((b: any) => ({
                    id: b.id,
                    title: `کلاس خصوصی — ${b.teacher.name}`,
                    // Combine date (YYYY-MM-DD) + startTime for correct positioning
                    date: `${b.date.substring(0, 10)}T${b.startTime}:00`,
                    type: "PRIVATE" as const,
                    description: b.specialization
                        ? `${b.specialization.subject} — پایه ${b.specialization.grade}`
                        : undefined,
                    startTime: b.startTime,
                    endTime: b.endTime,
                }));

            setSessions([...regularSessions, ...privateBookings] as any);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
            setReady(true);
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
                        مشاهده برنامه کلاس‌ها، جلسات جبرانی و کلاس‌های خصوصی
                    </p>
                </div>

                {!ready ? (
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
