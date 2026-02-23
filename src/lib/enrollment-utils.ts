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
