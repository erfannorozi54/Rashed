"use client";

import { SessionType } from "@prisma/client";

interface SessionTypeBadgeProps {
    type: SessionType;
    className?: string;
}

export function SessionTypeBadge({ type, className = "" }: SessionTypeBadgeProps) {
    const isScheduled = type === "SCHEDULED";

    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isScheduled
                    ? "bg-blue-100 text-blue-700"
                    : "bg-orange-100 text-orange-700"
                } ${className}`}
        >
            {isScheduled ? "جلسه عادی" : "جلسه جبرانی"}
        </span>
    );
}
