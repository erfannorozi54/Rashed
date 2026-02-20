import moment from "moment-jalaali";

// Configure moment-jalaali to use Persian numerals and calendar by default
moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

/**
 * Convert Gregorian date to Jalali (Persian) date string
 * @param date JavaScript Date or ISO string
 * @param format Format string (jYYYY/jMM/jDD by default)
 * @returns Formatted Jalali date string
 */
export function toJalali(date: Date | string, format: string = "jYYYY/jMM/jDD"): string {
    return moment(date).format(format);
}

/**
 * Convert Jalali date string to JavaScript Date
 * @param jalaliDate Jalali date string (e.g., "1403/09/08")
 * @param format Format of the input string
 * @returns JavaScript Date object
 */
export function fromJalali(jalaliDate: string, format: string = "jYYYY/jMM/jDD"): Date {
    return moment(jalaliDate, format).toDate();
}

/**
 * Format a date in Persian/Jalali calendar with custom format
 * @param date Date to format
 * @param format Moment-jalaali format string
 * @returns Formatted string
 */
export function formatJalali(date: Date | string, format: string): string {
    return moment(date).format(format);
}

/**
 * Get current Jalali date
 * @param format Format string
 * @returns Formatted current Jalali date
 */
export function nowJalali(format: string = "jYYYY/jMM/jDD"): string {
    return moment().format(format);
}

/**
 * Get Persian day of week name
 * @param date Date to get day name for
 * @returns Persian day name (شنبه، یکشنبه، etc.)
 */
export function getPersianDayName(date: Date | string): string {
    const dayNames = [
        "یکشنبه",   // Sunday
        "دوشنبه",   // Monday
        "سه‌شنبه",  // Tuesday
        "چهارشنبه", // Wednesday
        "پنج‌شنبه", // Thursday
        "جمعه",     // Friday
        "شنبه",     // Saturday
    ];
    return dayNames[moment(date).day()];
}

/**
 * Get Persian month name
 * @param monthIndex Jalali month index (1-12)
 * @returns Persian month name
 */
export function getPersianMonthName(monthIndex: number): string {
    const monthNames = [
        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان",
        "آذر",
        "دی",
        "بهمن",
        "اسفند",
    ];
    return monthNames[monthIndex - 1] || "";
}

/**
 * Format date for display with Persian month and day names
 * @param date Date to format
 * @returns String like "شنبه 8 آذر 1403"
 */
export function formatPersianDateLong(date: Date | string): string {
    const m = moment(date);
    const dayName = getPersianDayName(date);
    const day = m.jDate();
    const monthName = getPersianMonthName(m.jMonth() + 1);
    const year = m.jYear();
    return `${dayName} ${day} ${monthName} ${year}`;
}

/**
 * Format time in 24-hour format
 * @param date Date to extract time from
 * @returns Time string like "14:30"
 */
export function formatTime(date: Date | string): string {
    return moment(date).format("HH:mm");
}

/**
 * Parse time string and combine with Jalali date
 * @param jalaliDate Jalali date string
 * @param timeString Time string (HH:mm)
 * @returns JavaScript Date object
 */
export function parseJalaliDateTime(jalaliDate: string, timeString: string): Date {
    const datePart = moment(jalaliDate, "jYYYY/jMM/jDD");
    const [hours, minutes] = timeString.split(":").map(Number);
    datePart.hours(hours).minutes(minutes).seconds(0).milliseconds(0);
    return datePart.toDate();
}

/**
 * Check if a date is today
 * @param date Date to check
 * @returns true if date is today
 */
export function isToday(date: Date | string): boolean {
    const m = moment(date);
    const today = moment();
    return m.jYear() === today.jYear() &&
        m.jMonth() === today.jMonth() &&
        m.jDate() === today.jDate();
}

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns true if date is before now
 */
export function isPast(date: Date | string): boolean {
    return moment(date).isBefore(moment());
}

/**
 * Check if a date is in the future
 * @param date Date to check
 * @returns true if date is after now
 */
export function isFuture(date: Date | string): boolean {
    return moment(date).isAfter(moment());
}

/**
 * Get relative time in Persian (e.g., "2 ساعت پیش")
 * @param date Date to get relative time for
 * @returns Persian relative time string
 */
export function getRelativeTime(date: Date | string): string {
    const m = moment(date);
    const now = moment();
    const diffMinutes = now.diff(m, "minutes");
    const diffHours = now.diff(m, "hours");
    const diffDays = now.diff(m, "days");

    if (diffMinutes < 1) return "همین الان";
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;

    return formatPersianDateLong(date);
}

/**
 * Add days to a Jalali date
 * @param date Starting date
 * @param days Number of days to add
 * @returns New Date object
 */
export function addDays(date: Date | string, days: number): Date {
    return moment(date).add(days, "days").toDate();
}

/**
 * Add months to a Jalali date
 * @param date Starting date
 * @param months Number of months to add
 * @returns New Date object
 */
export function addMonths(date: Date | string, months: number): Date {
    return moment(date).add(months, "jMonth").toDate();
}

/**
 * Get start of day
 * @param date Date to get start of day for
 * @returns Date object at 00:00:00
 */
export function startOfDay(date: Date | string): Date {
    return moment(date).startOf("day").toDate();
}

/**
 * Get end of day
 * @param date Date to get end of day for
 * @returns Date object at 23:59:59
 */
export function endOfDay(date: Date | string): Date {
    return moment(date).endOf("day").toDate();
}
