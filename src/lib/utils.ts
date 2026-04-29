import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Check if a string contains only Persian/Arabic characters and spaces
 */
export function isPersian(text: string): boolean {
    const persianRegex = /^[\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9\s]+$/;
    return persianRegex.test(text);
}

/**
 * Validate Persian name (required, only Persian characters, min/max length)
 */
export function validatePersianName(name: string): { valid: boolean; message?: string } {
    if (!name || name.trim().length === 0) {
        return { valid: false, message: "این فیلد الزامی است" };
    }
    
    const trimmed = name.trim();
    if (trimmed.length < 2) {
        return { valid: false, message: "حداقل ۲ کاراکتر وارد کنید" };
    }
    
    if (!isPersian(trimmed)) {
        return { valid: false, message: "فقط حروف فارسی مجاز است" };
    }
    
    return { valid: true };
}

/**
 * Compute payment amount based on session price and minimum sessions to pay
 */
export function computePaymentAmount(
    sessionPrice: number,
    minSessionsToPay: number | null,
    totalSessions: number
): number {
    if (sessionPrice === 0) return 0;
    const min = minSessionsToPay ?? totalSessions;
    if (min === 0) return 0;
    return sessionPrice * min;
}
