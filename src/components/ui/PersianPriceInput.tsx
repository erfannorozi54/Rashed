"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function toPersianDigits(str: string): string {
    return str.replace(/[0-9]/g, (d) =>
        String.fromCharCode(d.charCodeAt(0) + 0x06f0 - 0x30)
    );
}

function toEnglishDigits(str: string): string {
    return str.replace(/[۰-۹]/g, (d) =>
        String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 0x30)
    );
}

function formatWithSeparators(num: number): string {
    return toPersianDigits(num.toLocaleString("en-US"));
}

interface PersianPriceInputProps {
    value: number | "";
    onChange: (value: number | "") => void;
    placeholder?: string;
    id?: string;
    className?: string;
    disabled?: boolean;
}

export default function PersianPriceInput({
    value,
    onChange,
    placeholder,
    id,
    className,
    disabled,
}: PersianPriceInputProps) {
    const [display, setDisplay] = useState(
        value !== "" ? formatWithSeparators(value) : ""
    );

    // Sync display when value is set from outside (e.g. loading an existing record)
    useEffect(() => {
        setDisplay(value !== "" ? formatWithSeparators(value as number) : "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = toEnglishDigits(e.target.value)
            .replace(/,/g, "")
            .replace(/\D/g, "");
        if (raw === "") {
            setDisplay("");
            onChange("");
            return;
        }
        const num = parseInt(raw, 10);
        setDisplay(formatWithSeparators(num));
        onChange(num);
    };

    return (
        <input
            id={id}
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={display}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
                "flex h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-left placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
        />
    );
}
