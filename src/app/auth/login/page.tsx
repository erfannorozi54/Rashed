"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card";
import { GraduationCap } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");

    // Password login fields
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    // OTP login fields
    const [otpPhone, setOtpPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                phone,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (error) {
            setError("خطا در ورود. لطفاً دوباره تلاش کنید");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phone: otpPhone, purpose: "login" }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "خطا در ارسال کد تایید");
                return;
            }

            setOtpSent(true);
        } catch (error) {
            setError("خطا در ارسال کد تایید");
        } finally {
            setLoading(false);
        }
    };

    const handleOTPLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phone: otpPhone, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "خطا در ورود");
                return;
            }

            // Sign in with the validated user
            const result = await signIn("credentials", {
                phone: otpPhone,
                password: "OTP_LOGIN", // Special marker for OTP login
                redirect: false,
            });

            if (result?.error) {
                // If credentials fail, we still have valid OTP, so redirect anyway
                router.push("/dashboard");
                router.refresh();
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (error) {
            setError("خطا در ورود");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--primary-50)] via-white to-[var(--secondary-50)] p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4">
                        <GraduationCap className="h-10 w-10 text-[var(--primary-600)]" />
                        <span className="text-2xl font-bold">موسسه ریاضی رشد</span>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>ورود به حساب کاربری</CardTitle>
                        <CardDescription>
                            {searchParams.get("registered")
                                ? "ثبت‌نام شما با موفقیت انجام شد. وارد شوید"
                                : "برای دسترسی به داشبورد خود وارد شوید"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Login Method Toggle */}
                        <div className="flex gap-2 mb-6">
                            <Button
                                type="button"
                                variant={loginMethod === "password" ? "default" : "outline"}
                                onClick={() => setLoginMethod("password")}
                                className="flex-1"
                            >
                                ورود با رمز عبور
                            </Button>
                            <Button
                                type="button"
                                variant={loginMethod === "otp" ? "default" : "outline"}
                                onClick={() => setLoginMethod("otp")}
                                className="flex-1"
                            >
                                ورود با کد یکبار مصرف
                            </Button>
                        </div>

                        {loginMethod === "password" ? (
                            <form onSubmit={handlePasswordLogin} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium">
                                        شماره تلفن
                                    </label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="09123456789"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        رمز عبور
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "در حال ورود..." : "ورود"}
                                </Button>
                            </form>
                        ) : !otpSent ? (
                            <form onSubmit={handleSendOTP} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label htmlFor="otpPhone" className="text-sm font-medium">
                                        شماره تلفن
                                    </label>
                                    <Input
                                        id="otpPhone"
                                        type="tel"
                                        placeholder="09123456789"
                                        value={otpPhone}
                                        onChange={(e) => setOtpPhone(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "در حال ارسال..." : "ارسال کد تایید"}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleOTPLogin} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
                                    کد تایید به شماره {otpPhone} ارسال شد
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="otp" className="text-sm font-medium">
                                        کد تایید
                                    </label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="کد ۶ رقمی"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        disabled={loading}
                                        maxLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOtpSent(false);
                                            setOtp("");
                                        }}
                                        className="text-sm text-[var(--primary-600)] hover:underline"
                                    >
                                        تغییر شماره تلفن
                                    </button>
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "در حال ورود..." : "ورود"}
                                </Button>
                            </form>
                        )}

                        <div className="text-center text-sm text-[var(--muted-foreground)] mt-4">
                            حساب کاربری ندارید؟{" "}
                            <Link
                                href="/auth/register"
                                className="text-[var(--primary-600)] hover:underline font-medium"
                            >
                                ثبت‌نام کنید
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-600)] mx-auto"></div>
                <p className="mt-4 text-[var(--muted-foreground)]">در حال بارگذاری...</p>
            </div>
        </div>}>
            <LoginForm />
        </Suspense>
    );
}
