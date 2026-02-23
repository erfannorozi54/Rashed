"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

function MockPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentId = searchParams.get("payment_id");

    const [loading, setLoading] = useState(true);
    const [paymentInfo, setPaymentInfo] = useState<{
        amount: number;
        className: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!paymentId) {
            setError("شناسه پرداخت معتبر نیست");
            setLoading(false);
            return;
        }
        fetchPayment();
    }, [paymentId]);

    const fetchPayment = async () => {
        try {
            const res = await fetch(`/api/payments/${paymentId}`);
            const data = await res.json();
            if (res.ok) {
                setPaymentInfo({
                    amount: data.payment.amount,
                    className: data.payment.class.name,
                });
            } else {
                setError(data.error || "خطا در دریافت اطلاعات پرداخت");
            }
        } catch (e) {
            setError("خطا در دریافت اطلاعات پرداخت");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]"></div>
            </div>
        );
    }

    if (error || !paymentInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--muted)]">
                <Card className="max-w-sm w-full mx-4">
                    <CardContent className="text-center py-8">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600">{error || "خطا"}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleAction = (status: "success" | "failed") => {
        router.push(`/payment/callback?payment_id=${paymentId}&status=${status}`);
    };

    return (
        <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center px-4">
            <Card className="max-w-md w-full shadow-xl">
                <CardHeader className="text-center border-b border-[var(--border)]">
                    <div className="text-2xl font-bold text-[var(--primary-700)] mb-1">
                        درگاه پرداخت
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">آموزشگاه ریاضی راشد</p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {/* Warning */}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="text-sm">این صفحه شبیه‌ساز درگاه پرداخت است و جهت تست استفاده می‌شود</p>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                            <span className="text-sm text-[var(--muted-foreground)]">کلاس</span>
                            <span className="font-medium">{paymentInfo.className}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-[var(--muted-foreground)]">مبلغ پرداختی</span>
                            <span className="font-bold text-xl text-[var(--primary-700)]">
                                {paymentInfo.amount.toLocaleString("fa-IR")} تومان
                            </span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button
                            onClick={() => handleAction("success")}
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                            <CheckCircle className="h-4 w-4" />
                            پرداخت موفق
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleAction("failed")}
                            className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
                        >
                            <XCircle className="h-4 w-4" />
                            پرداخت ناموفق
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function MockPaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]"></div>
            </div>
        }>
            <MockPaymentContent />
        </Suspense>
    );
}
