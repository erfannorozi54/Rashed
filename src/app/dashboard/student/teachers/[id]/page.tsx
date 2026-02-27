"use client";

import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import WeeklySchedulePreview, { type DaySchedule } from "@/components/ui/WeeklySchedulePreview";
import { toJalali } from "@/lib/jalali-utils";

export default function StudentTeacherSchedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [teacher, setTeacher] = useState<{ name: string } | null>(null);
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);

    const getDateForOffset = (offset: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offset * 7);
        return d.toISOString().split("T")[0];
    };

    useEffect(() => {
        fetch(`/api/users/${id}`).then((r) => r.json()).then(setTeacher);
    }, [id]);

    useEffect(() => {
        setLoading(true);
        const date = getDateForOffset(weekOffset);
        fetch(`/api/teachers/${id}/availability/weekly-schedule?date=${date}`)
            .then((r) => r.json())
            .then((d) => setSchedule(d.schedule || []))
            .finally(() => setLoading(false));
    }, [id, weekOffset]);

    const weekLabel = schedule.length >= 2
        ? `${toJalali(schedule[0].date, "jDD jMMMM")} تا ${toJalali(schedule[6]?.date || schedule[schedule.length - 1].date, "jDD jMMMM jYYYY")}`
        : "";

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title={`برنامه ${teacher?.name || "استاد"}`} />
            <main className="container mx-auto px-4 py-8 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <CardTitle>{teacher?.name || "..."}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => setWeekOffset((o) => o - 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                    هفته قبل
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
                                    این هفته
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setWeekOffset((o) => o + 1)}>
                                    هفته بعد
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {weekLabel && (
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">{weekLabel}</p>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" />
                            </div>
                        ) : (
                            <WeeklySchedulePreview schedule={schedule} />
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
