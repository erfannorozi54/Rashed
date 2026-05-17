"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle } from "lucide-react";

function PaymentCallbackContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get("status");
    const success = status === "success";

    return (
        <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center px-4">
            <Card className="max-w-sm w-full shadow-xl">
                <CardContent className="text-center py-10 space-y-6">
                    {success ? (
                        <>
                            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                            <div>
                                <h2 className="text-2xl font-bold text-green-700 mb-2">پرداخت موفق</h2>
                                <p className="text-[var(--muted-foreground)]">ثبت‌نام شما با موفقیت انجام شد</p>
                            </div>
                            <Link href="/dashboard/student/classes">
                                <Button className="w-full">مشاهده کلاس‌های من</Button>
                            </Link>
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
                            <Link href="/classes">
                                <Button variant="outline" className="w-full">بازگشت به کلاس‌ها</Button>
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
