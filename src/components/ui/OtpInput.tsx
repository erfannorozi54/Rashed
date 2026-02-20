"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function OtpInput({
    length = 6,
    value,
    onChange,
    disabled,
    className,
}: OtpInputProps) {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const setChar = (index: number, char: string) => {
        const chars = value.padEnd(length, " ").split("").slice(0, length);
        chars[index] = char;
        onChange(chars.join("").replace(/\s+$/, ""));
    };

    const handleChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const digit = e.target.value.replace(/\D/g, "").slice(-1);
        setChar(index, digit);
        if (digit && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            if (value[index]) {
                setChar(index, " ");
            } else if (index > 0) {
                inputs.current[index - 1]?.focus();
                const chars = value.padEnd(length, " ").split("").slice(0, length);
                chars[index - 1] = " ";
                onChange(chars.join("").replace(/\s+$/, ""));
            }
        } else if (e.key === "ArrowLeft" && index < length - 1) {
            inputs.current[index + 1]?.focus();
        } else if (e.key === "ArrowRight" && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, length);
        onChange(pasted);
        const focusIndex = Math.min(pasted.length, length - 1);
        inputs.current[focusIndex]?.focus();
    };

    return (
        <div className={cn("flex gap-2 justify-center", className)} dir="ltr">
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => {
                        inputs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ""}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={cn(
                        "w-11 h-12 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200",
                        "border-[var(--border)] bg-white text-[var(--foreground)]",
                        "focus:border-[var(--primary-600)] focus:ring-2 focus:ring-[var(--primary-100)] focus:outline-none",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        value[i] &&
                            value[i] !== " " &&
                            "border-[var(--primary-400)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                    )}
                />
            ))}
        </div>
    );
}
