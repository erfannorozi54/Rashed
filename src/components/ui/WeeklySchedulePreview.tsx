"use client";

import { cn } from "@/lib/utils";
import { toJalali } from "@/lib/jalali-utils";

const DAY_NAMES = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7..22

export type SegmentState = "unavailable" | "available" | "busy";

export interface ScheduleSegment {
    start: string;
    end: string;
    state: SegmentState;
}

export interface DaySchedule {
    dayOfWeek: number;
    date: string;
    segments: ScheduleSegment[];
}

interface WeeklySchedulePreviewProps {
    schedule: DaySchedule[];
    className?: string;
}

function timeToMin(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

const STATE_COLORS: Record<SegmentState, string> = {
    unavailable: "bg-gray-100",
    available: "bg-emerald-200",
    busy: "bg-red-200",
};

export default function WeeklySchedulePreview({ schedule, className }: WeeklySchedulePreviewProps) {
    const totalMin = (22 - 7) * 60; // 900 minutes

    return (
        <div className={cn("space-y-3", className)}>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-300" />
                    غیرفعال
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-emerald-200 border border-emerald-400" />
                    آزاد
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-red-200 border border-red-400" />
                    مشغول
                </span>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    {/* Hour labels */}
                    <div className="flex">
                        <div className="w-20 shrink-0" />
                        <div className="flex-1 relative h-5">
                            {HOURS.map((h) => {
                                const pct = ((h - 7) * 60 / totalMin) * 100;
                                return (
                                    <span
                                        key={h}
                                        className="absolute text-[10px] text-[var(--muted-foreground)] -translate-x-1/2"
                                        style={{ left: `${pct}%` }}
                                    >
                                        {h}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Day rows */}
                    {schedule.map((day) => (
                        <div key={day.dayOfWeek} className="flex items-center mb-1">
                            <div className="w-20 shrink-0 text-xs text-left pl-2">
                                <div className="font-medium">{DAY_NAMES[day.dayOfWeek]}</div>
                                <div className="text-[10px] text-[var(--muted-foreground)]">
                                    {toJalali(day.date, "jMM/jDD")}
                                </div>
                            </div>
                            <div className="flex-1 relative h-7 rounded bg-gray-100 overflow-hidden border border-[var(--border)]">
                                {day.segments.map((seg, i) => {
                                    const startMin = timeToMin(seg.start) - 7 * 60;
                                    const endMin = timeToMin(seg.end) - 7 * 60;
                                    const left = (startMin / totalMin) * 100;
                                    const width = ((endMin - startMin) / totalMin) * 100;
                                    if (seg.state === "unavailable") return null;
                                    return (
                                        <div
                                            key={i}
                                            className={cn("absolute top-0 h-full", STATE_COLORS[seg.state])}
                                            style={{ left: `${left}%`, width: `${width}%` }}
                                            title={`${seg.start}–${seg.end}`}
                                        />
                                    );
                                })}
                                {/* Hour grid lines */}
                                {HOURS.slice(1).map((h) => {
                                    const pct = ((h - 7) * 60 / totalMin) * 100;
                                    return (
                                        <div
                                            key={h}
                                            className="absolute top-0 h-full w-px bg-gray-300/50"
                                            style={{ left: `${pct}%` }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
