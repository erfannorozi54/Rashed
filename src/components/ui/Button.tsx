import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "destructive";
    size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const baseStyles =
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            default:
                "bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] focus-visible:ring-[var(--primary-600)]",
            outline:
                "border-2 border-[var(--border)] bg-transparent hover:bg-[var(--muted)] focus-visible:ring-[var(--ring)]",
            ghost: "hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
            destructive:
                "bg-[var(--error)] text-white hover:bg-red-600 focus-visible:ring-[var(--error)]",
        };

        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export { Button };
