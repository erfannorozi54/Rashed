"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { CreditCard, RefreshCw, Calendar, ArrowLeftRight } from "lucide-react";
import { toJalali } from "@/lib/jalali-utils";

interface Payment {
    id: string;
    amount: number;
    status: "PENDING" | "SUCCESS" | "FAILED";
    createdAt: string;
    paidAt: string | null;
    class: { id: string; name: string };
}

interface RefundReq {
    id: string;
    amount: number;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    adminNote: string | null;
    createdAt: string;
    payment: { amount: number; class: { name: string } };
}

interface Breakdown {
    classId: string;
    className: string;
    sessionsInScope: number;
    sessionPrice: number;
    totalCost: number;
    paidAmount: number;
}

interface ReschedulableSession {
    id: string;
    title: string;
    date: string;
    className: string;
    teacherId: string;
    sessionDuration: number;
    sessionPrice: number;
}

interface AccountData {
    debt: number;
    maxDebtLimit: number;
    breakdown: Breakdown[];
    payments: Payment[];
    refundRequests: RefundReq[];
    reschedulableSessions: ReschedulableSession[];
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    SUCCESS: { label: "موفق", cls: "bg-green-100 text-green-700" },
    PENDING: { label: "در انتظار", cls: "bg-amber-100 text-amber-700" },
    FAILED: { label: "ناموفق", cls: "bg-red-100 text-red-700" },
    APPROVED: { label: "تایید شده", cls: "bg-green-100 text-green-700" },
    REJECTED: { label: "رد شده", cls: "bg-red-100 text-red-700" },
};

export default function StudentAccountPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<AccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundPaymentId, setRefundPaymentId] = useState("");
    const [refundAmount, setRefundAmount] = useState("");
    const [refundReason, setRefundReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!session?.user?.id) return;
        fetchData();
    }, [session]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/students/${session!.user.id}/account`);
            if (res.ok) setData(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleRefundSubmit = async () => {
        if (!refundPaymentId || !refundAmount || !refundReason) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/refunds", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: refundPaymentId, amount: Number(refundAmount.replace(/\D/g, "")), reason: refundReason }),
            });
            if (res.ok) {
                setShowRefundForm(false);
                setRefundPaymentId(""); setRefundAmount(""); setRefundReason("");
                fetchData();
            } else {
                const d = await res.json();
                alert(d.error || "خطا");
            }
        } catch (e) { alert("خطا"); }
        finally { setSubmitting(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--muted)]">
                <DashboardHeader title="حساب من" />
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)]" /></div>
            </div>
        );
    }

    if (!data) return null;

    const debtPct = data.maxDebtLimit > 0 ? Math.min((data.debt / data.maxDebtLimit) * 100, 100) : 0;
    const successPayments = data.payments.filter((p) => p.status === "SUCCESS");

    return (
        <div className="min-h-screen bg-[var(--muted)]">
            <DashboardHeader title="حساب من" />
            <main className="container mx-auto px-4 py-8 space-y-6">
                {/* Debt Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            خلاصه مالی
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[var(--muted-foreground)]">بدهی فعلی</span>
                            <span className={`text-2xl font-bold ${data.debt > 0 ? "text-amber-700" : "text-green-600"}`}>
                                {data.debt.toLocaleString("fa-IR")} تومان
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${debtPct > 80 ? "bg-red-500" : debtPct > 50 ? "bg-amber-500" : "bg-green-500"}`}
                                style={{ width: `${debtPct}%` }}
                            />
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">
                            سقف بدهی: {data.maxDebtLimit.toLocaleString("fa-IR")} تومان
                        </p>

                        {data.breakdown.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium">جزئیات بدهی:</p>
                                {data.breakdown.map((b) => (
                                    <div key={b.classId} className="flex items-center justify-between text-sm p-2 rounded bg-[var(--muted)]">
                                        <span>{b.className} ({b.sessionsInScope} جلسه)</span>
                                        <span>{(b.totalCost - b.paidAmount).toLocaleString("fa-IR")} تومان</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment History */}
                <Card>
                    <CardHeader>
                        <CardTitle>تاریخچه پرداخت</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.payments.length === 0 ? (
                            <p className="text-center text-[var(--muted-foreground)] py-6">پرداختی ثبت نشده</p>
                        ) : (
                            <div className="space-y-3">
                                {data.payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]">
                                        <div>
                                            <p className="font-medium">{p.class.name}</p>
                                            <p className="text-xs text-[var(--muted-foreground)]">{toJalali(p.createdAt)}</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">{p.amount.toLocaleString("fa-IR")} تومان</p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[p.status]?.cls}`}>
                                                {STATUS_BADGE[p.status]?.label}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Refund Requests */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" />
                                درخواست‌های استرداد
                            </CardTitle>
                            <Button size="sm" onClick={() => setShowRefundForm(!showRefundForm)}>
                                درخواست استرداد
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {showRefundForm && (
                            <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)] space-y-3">
                                <select
                                    value={refundPaymentId}
                                    onChange={(e) => setRefundPaymentId(e.target.value)}
                                    className="w-full p-2 rounded border border-[var(--border)] bg-white text-sm"
                                >
                                    <option value="">انتخاب پرداخت...</option>
                                    {successPayments.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.class.name} — {p.amount.toLocaleString()} تومان
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="مبلغ (تومان)"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value.replace(/\D/g, ""))}
                                />
                                <Textarea
                                    placeholder="دلیل درخواست استرداد..."
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                />
                                <Button onClick={handleRefundSubmit} disabled={submitting}>
                                    {submitting ? "ارسال..." : "ارسال درخواست"}
                                </Button>
                            </div>
                        )}

                        {data.refundRequests.length === 0 ? (
                            <p className="text-center text-[var(--muted-foreground)] py-4">درخواستی ثبت نشده</p>
                        ) : (
                            <div className="space-y-3">
                                {data.refundRequests.map((r) => (
                                    <div key={r.id} className="p-3 rounded-lg border border-[var(--border)]">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium">{r.payment.class.name}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[r.status]?.cls}`}>
                                                {STATUS_BADGE[r.status]?.label}
                                            </span>
                                        </div>
                                        <p className="text-sm">{r.amount.toLocaleString("fa-IR")} تومان</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">{r.reason}</p>
                                        {r.adminNote && <p className="text-xs text-blue-600 mt-1">پاسخ مدیر: {r.adminNote}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Reschedulable Sessions */}
                {data.reschedulableSessions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowLeftRight className="h-5 w-5" />
                                تغییر زمان جلسه
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {data.reschedulableSessions.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]">
                                        <div>
                                            <p className="font-medium">{s.title}</p>
                                            <p className="text-xs text-[var(--muted-foreground)]">
                                                {s.className} — {toJalali(s.date)}
                                            </p>
                                        </div>
                                        <Link href={`/dashboard/student/account/reschedule/${s.id}`}>
                                            <Button size="sm" variant="outline">
                                                <Calendar className="h-4 w-4 ml-1" />
                                                تغییر زمان
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
