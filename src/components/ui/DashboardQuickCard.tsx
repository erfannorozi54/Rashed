import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface DashboardQuickCardProps {
    title: string;
    value?: string | number;
    description: string;
    icon: LucideIcon;
    href?: string;
    accentClassName?: string;
    className?: string;
}

export default function DashboardQuickCard({
    title,
    value,
    description,
    icon: Icon,
    href,
    accentClassName,
    className,
}: DashboardQuickCardProps) {
    const content = (
        <Card
            className={cn(
                "h-full rounded-2xl border-[var(--border)] shadow-sm transition-all duration-200",
                href && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
                className,
            )}
        >
            <CardContent className="flex h-full items-start justify-between gap-4 p-4">
                <div className="min-w-0 space-y-2">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
                    {value !== undefined && (
                        <p className={cn("text-2xl font-bold leading-none", accentClassName)}>{value}</p>
                    )}
                    <p className="text-xs leading-5 text-[var(--muted-foreground)]">{description}</p>
                </div>

                <span
                    className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--primary-600)]",
                        accentClassName,
                    )}
                >
                    <Icon className="h-5 w-5" />
                </span>
            </CardContent>
        </Card>
    );

    if (!href) {
        return content;
    }

    return (
        <Link
            href={href}
            className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:ring-offset-2"
        >
            {content}
        </Link>
    );
}
