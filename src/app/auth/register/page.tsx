"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Step 1 fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");

    // Step 2 fields
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Send OTP
            const response = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phone, purpose: "register" }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "خطا در ارسال کد تایید");
                return;
            }

            setOtpSent(true);
            setStep(2);
        } catch (error) {
            setError("خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید");
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("رمز عبور و تکرار آن یکسان نیستند");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    otp,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "خطا در ثبت‌نام");
                return;
            }

            // Redirect to login after successful registration
            router.push("/auth/login?registered=true");
        } catch (error) {
            setError("خطا در ثبت‌نام. لطفاً دوباره تلاش کنید");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phone, purpose: "register" }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "خطا در ارسال مجدد کد");
                return;
            }

            setError("");
            alert("کد تایید مجدداً ارسال شد");
        } catch (error) {
            setError("خطا در ارسال مجدد کد");
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
                        <CardTitle>ثبت‌نام - مرحله {step} از ۲</CardTitle>
                        <CardDescription>
                            {step === 1
                                ? "اطلاعات خود را وارد کنید"
                                : "کد تایید و رمز عبور را وارد کنید"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {step === 1 ? (
                            <form onSubmit={handleStep1Submit} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label htmlFor="firstName" className="text-sm font-medium">
                                        نام
                                    </label>
                                    <Input
                                        id="firstName"
                                        type="text"
                                        placeholder="نام خود را وارد کنید"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="lastName" className="text-sm font-medium">
                                        نام خانوادگی
                                    </label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="نام خانوادگی خود را وارد کنید"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

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
                                        pattern="09\d{9}"
                                        title="شماره تلفن باید با 09 شروع شود و 11 رقم باشد"
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "در حال ارسال کد..." : "ارسال کد تایید"}
                                </Button>

                                <div className="text-center text-sm text-[var(--muted-foreground)]">
                                    قبلاً ثبت‌نام کرده‌اید؟{" "}
                                    <Link
                                        href="/auth/login"
                                        className="text-[var(--primary-600)] hover:underline font-medium"
                                    >
                                        وارد شوید
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleStep2Submit} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                {otpSent && (
                                    <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
                                        کد تایید به شماره {phone} ارسال شد
                                    </div>
                                )}

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
                                        pattern="\d{6}"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        className="text-sm text-[var(--primary-600)] hover:underline"
                                    >
                                        ارسال مجدد کد
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        رمز عبور
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="حداقل ۸ کاراکتر (شامل حروف و اعداد)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        minLength={8}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="confirmPassword"
                                        className="text-sm font-medium"
                                    >
                                        تکرار رمز عبور
                                    </label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="رمز عبور را دوباره وارد کنید"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        <ArrowLeft className="h-4 w-4 ml-2" />
                                        بازگشت
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={loading}
                                    >
                                        {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
