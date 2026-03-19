"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle } from "lucide-react";

function PaymentCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentId = searchParams.get("payment_id");
    const bookingId = searchParams.get("booking_id");
    const type = searchParams.get("type");
    const status = searchParams.get("status") as "success" | "failed" | null;
    const isPrivate = type === "private";

    const [processing, setProcessing] = useState(true);
    const [result, setResult] = useState<"success" | "failed" | null>(null);

    useEffect(() => {
        if ((!paymentId && !bookingId) || !status) {
            setProcessing(false);
            setResult("failed");
            return;
        }
        processCallback();
    }, [paymentId, bookingId, status, isPrivate]);

    const processCallback = async () => {
        try {
            if (isPrivate) {
                const res = await fetch("/api/private-bookings/callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookingId, status }),
                });
                const data = await res.json();
                setResult(data.success ? "success" : "failed");
            } else {
                const res = await fetch("/api/payments/callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId, status }),
                });
                const data = await res.json();
                setResult(data.success ? "success" : "failed");
            }
        } catch (e) {
            setResult("failed");
        } finally {
            setProcessing(false);
        }
    };

    if (processing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--muted)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-600)] mb-4"></div>
                <p className="text-[var(--muted-foreground)]">در حال پردازش نتیجه پرداخت...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center px-4">
            <Card className="max-w-sm w-full shadow-xl">
                <CardContent className="text-center py-10 space-y-6">
                    {result === "success" ? (
                        <>
                            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                            <div>
                                <h2 className="text-2xl font-bold text-green-700 mb-2">پرداخت موفق</h2>
                                <p className="text-[var(--muted-foreground)]">
                                    {isPrivate ? "رزرو جلسه خصوصی با موفقیت انجام شد" : "ثبت‌نام شما با موفقیت انجام شد"}
                                </p>
                            </div>
                            {isPrivate ? (
                                <Link href="/dashboard/student/book-session">
                                    <Button className="w-full">مشاهده رزروهای من</Button>
                                </Link>
                            ) : (
                                <Link href="/dashboard/student/classes">
                                    <Button className="w-full">مشاهده کلاس‌های من</Button>
                                </Link>
                            )}
                        </>
                    ) : (
                        <>
                            <XCircle className="h-20 w-20 text-red-500 mx-auto" />
                            <div>
                                <h2 className="text-2xl font-bold text-red-700 mb-2">پرداخت ناموفق</h2>
                                <p className="text-[var(--muted-foreground)]">
                                    متأسفانه پرداخت انجام نشد. می‌توانید دوباره تلاش کنید.
                                </p>
                            </div>
                            {isPrivate && bookingId ? (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() =>
                                        router.push(`/payment/mock?booking_id=${bookingId}&type=private`)
                                    }
                                >
                                    تلاش مجدد
                                </Button>
                            ) : paymentId ? (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() =>
                                        router.push(`/payment/mock?payment_id=${paymentId}`)
                                    }
                                >
                                    تلاش مجدد
                                </Button>
                            ) : null}
                            <Link href={isPrivate ? "/dashboard/student/book-session" : "/classes"}>
                                <Button variant="ghost" className="w-full">
                                    {isPrivate ? "بازگشت به رزرو جلسه" : "بازگشت به کلاس‌ها"}
                                </Button>
                            </Link>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]"></div>
            </div>
        }>
            <PaymentCallbackContent />
        </Suspense>
    );
}
