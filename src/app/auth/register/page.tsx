"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/ui/OtpInput";
import { cn } from "@/lib/utils";
import {
    GraduationCap,
    User,
    Phone,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    ArrowLeft,
    RefreshCw,
    BookOpen,
    Trophy,
    CalendarDays,
    ChevronLeft,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
    textColor: string;
} {
    let score = 0;
    if (password.length >= 8) score++;
    if (/\d/.test(password)) score++;
    if (/[a-zA-Z]/.test(password)) score++;
    if (password.length >= 12) score++;

    if (score <= 1)
        return { score, label: "ضعیف", color: "bg-red-400", textColor: "text-red-500" };
    if (score === 2)
        return { score, label: "متوسط", color: "bg-yellow-400", textColor: "text-yellow-600" };
    if (score === 3)
        return { score, label: "خوب", color: "bg-blue-400", textColor: "text-blue-600" };
    return { score, label: "قوی", color: "bg-green-500", textColor: "text-green-600" };
}

const FEATURES = [
    { icon: BookOpen, text: "دسترسی به جلسات آنلاین و حضوری" },
    { icon: Trophy, text: "مشاهده تکالیف و نمرات در لحظه" },
    { icon: CalendarDays, text: "تقویم فارسی با برنامه هفتگی" },
];

// ─── step bubble ────────────────────────────────────────────────────────────

function StepBubble({
    number,
    active,
    done,
    label,
}: {
    number: number;
    active: boolean;
    done: boolean;
    label: string;
}) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div
                className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    done
                        ? "bg-[var(--primary-600)] text-white"
                        : active
                        ? "bg-[var(--primary-600)] text-white ring-4 ring-[var(--primary-100)]"
                        : "bg-[var(--muted)] border-2 border-[var(--border)] text-[var(--muted-foreground)]"
                )}
            >
                {done ? <CheckCircle className="w-5 h-5" /> : number}
            </div>
            <span
                className={cn(
                    "text-xs whitespace-nowrap transition-colors duration-300",
                    active
                        ? "text-[var(--primary-600)] font-medium"
                        : "text-[var(--muted-foreground)]"
                )}
            >
                {label}
            </span>
        </div>
    );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName]   = useState("");
    const [phone, setPhone]         = useState("");

    const [otp, setOtp]                         = useState("");
    const [password, setPassword]               = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword]               = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const sendOtp = useCallback(async (phoneNumber: string) => {
        return fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: phoneNumber, purpose: "register" }),
        });
    }, []);

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res  = await sendOtp(phone);
            const data = await res.json();
            if (!res.ok) { setError(data.error || "خطا در ارسال کد تایید"); return; }
            setCountdown(60);
            setStep(2);
        } catch {
            setError("خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید");
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (otp.length < 6) { setError("کد تایید را کامل وارد کنید"); return; }
        if (password !== confirmPassword) { setError("رمز عبور و تکرار آن یکسان نیستند"); return; }
        setLoading(true);
        try {
            const res  = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, phone, otp, password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "خطا در ثبت‌نام"); return; }
            router.push("/auth/login?registered=true");
        } catch {
            setError("خطا در ثبت‌نام. لطفاً دوباره تلاش کنید");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0 || loading) return;
        setError("");
        setLoading(true);
        try {
            const res  = await sendOtp(phone);
            const data = await res.json();
            if (!res.ok) { setError(data.error || "خطا در ارسال مجدد کد"); return; }
            setCountdown(60);
            setOtp("");
        } catch {
            setError("خطا در ارسال مجدد کد");
        } finally {
            setLoading(false);
        }
    };

    const strength = getPasswordStrength(password);

    return (
        <div className="min-h-screen flex">
            {/* ── Left decorative panel ── */}
            <div className="hidden lg:flex lg:w-5/12 xl:w-[45%] relative flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--primary-900)] via-[var(--primary-700)] to-[var(--primary-600)]">
                {/* animated blobs */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-[var(--primary-500)] rounded-full mix-blend-multiply opacity-20 animate-blob" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[var(--secondary-400)] rounded-full mix-blend-multiply opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute top-1/2 left-1/3 w-56 h-56 bg-[var(--primary-400)] rounded-full mix-blend-multiply opacity-15 animate-blob animation-delay-4000" />

                {/* content */}
                <div className="relative z-10 text-white w-full flex flex-col items-center px-10 py-12">
                    {/* logo */}
                    <div className="flex items-center justify-center gap-3 mb-8 w-full">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm shrink-0">
                            <GraduationCap className="w-6 h-6 text-[var(--secondary-300)]" />
                        </div>
                        <span className="text-xl font-bold leading-tight text-right">
                            موسسه ریاضی{" "}
                            <span className="text-[var(--secondary-300)]">راشد</span>
                        </span>
                    </div>

                    {/* illustration */}
                    <div className="w-4/5 mb-6">
                        <Image
                            src="/images/auth/register-illustration.webp"
                            alt="تصویر ثبت‌نام"
                            width={600}
                            height={390}
                            className="w-full h-auto mix-blend-multiply"
                            priority
                        />
                    </div>

                    {/* tagline */}
                    <h2 className="text-2xl font-bold mb-2 text-center leading-snug">
                        یاد بگیر، راشد کن، موفق شو
                    </h2>
                    <p className="text-[var(--primary-200)] text-sm text-center leading-relaxed mb-8">
                        با ثبت‌نام در موسسه ریاضی راشد به دنیای یادگیری حرفه‌ای قدم بگذارید
                    </p>

                    {/* feature list */}
                    <div className="space-y-3 w-full max-w-xs">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                                    <f.icon className="w-4 h-4 text-[var(--secondary-300)]" />
                                </div>
                                <span className="text-sm text-[var(--primary-100)]">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-white min-h-screen overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <GraduationCap className="h-9 w-9 text-[var(--primary-600)]" />
                            <span className="text-xl font-bold">موسسه ریاضی راشد</span>
                        </Link>
                    </div>

                    {/* header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">
                            ایجاد حساب کاربری
                        </h1>
                        <p className="text-sm text-[var(--muted-foreground)]">
                            قبلاً ثبت‌نام کرده‌اید؟{" "}
                            <Link
                                href="/auth/login"
                                className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium hover:underline"
                            >
                                وارد شوید
                            </Link>
                        </p>
                    </div>

                    {/* step indicator */}
                    <div className="flex items-center mb-8">
                        <StepBubble number={1} active={step === 1} done={step > 1} label="اطلاعات شخصی" />
                        <div
                            className={cn(
                                "flex-1 h-0.5 mx-2 rounded-full transition-all duration-500",
                                step > 1
                                    ? "bg-[var(--primary-600)]"
                                    : "bg-[var(--border)]"
                            )}
                        />
                        <StepBubble number={2} active={step === 2} done={false} label="تایید هویت" />
                    </div>

                    {/* error */}
                    {error && (
                        <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
                            <span className="text-red-500 mt-0.5 text-base leading-none">✕</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ── STEP 1 ── */}
                    {step === 1 && (
                        <form onSubmit={handleStep1Submit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="firstName" className="text-sm font-medium text-[var(--foreground)]">
                                        نام
                                    </label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                                        <Input
                                            id="firstName"
                                            type="text"
                                            placeholder="نام"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="pr-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="lastName" className="text-sm font-medium text-[var(--foreground)]">
                                        نام خانوادگی
                                    </label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                                        <Input
                                            id="lastName"
                                            type="text"
                                            placeholder="نام خانوادگی"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="pr-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="phone" className="text-sm font-medium text-[var(--foreground)]">
                                    شماره تلفن همراه
                                </label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="09123456789"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        disabled={loading}
                                        pattern="09\d{9}"
                                        title="شماره تلفن باید با 09 شروع شود و ۱۱ رقم باشد"
                                        className="pr-9"
                                        dir="ltr"
                                    />
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                    کد تایید به این شماره ارسال می‌شود
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base mt-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        در حال ارسال کد...
                                    </>
                                ) : (
                                    <>
                                        ارسال کد تایید
                                        <ChevronLeft className="h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <p className="text-center text-xs text-[var(--muted-foreground)] pt-1">
                                با ثبت‌نام، با{" "}
                                <span className="text-[var(--primary-600)] cursor-pointer hover:underline">
                                    قوانین و مقررات
                                </span>{" "}
                                موسسه موافقت می‌کنید
                            </p>
                        </form>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === 2 && (
                        <form onSubmit={handleStep2Submit} className="space-y-5">
                            {/* OTP notice */}
                            <div className="p-3.5 rounded-xl bg-[var(--primary-50)] border border-[var(--primary-100)] text-[var(--primary-700)] text-sm leading-relaxed">
                                کد تایید به شماره{" "}
                                <span className="font-bold" dir="ltr">
                                    {phone}
                                </span>{" "}
                                ارسال شد
                            </div>

                            {/* OTP boxes */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-[var(--foreground)] block text-center">
                                    کد تایید ۶ رقمی را وارد کنید
                                </label>
                                <OtpInput
                                    value={otp}
                                    onChange={setOtp}
                                    disabled={loading}
                                />
                                <div className="text-center pt-1">
                                    {countdown > 0 ? (
                                        <span className="text-sm text-[var(--muted-foreground)]">
                                            ارسال مجدد تا{" "}
                                            <span className="font-bold tabular-nums text-[var(--primary-600)]">
                                                {countdown}
                                            </span>{" "}
                                            ثانیه دیگر
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            disabled={loading}
                                            className="inline-flex items-center gap-1.5 text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] hover:underline font-medium disabled:opacity-50"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            ارسال مجدد کد
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* password */}
                            <div className="space-y-1.5">
                                <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
                                    رمز عبور
                                </label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="حداقل ۸ کاراکتر (حروف و اعداد)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        minLength={8}
                                        className="pr-9 pl-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        tabIndex={-1}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                {/* strength bar */}
                                {password && (
                                    <div className="space-y-1 pt-0.5">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "h-1 flex-1 rounded-full transition-all duration-300",
                                                        i <= strength.score
                                                            ? strength.color
                                                            : "bg-[var(--border)]"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-[var(--muted-foreground)]">
                                            قدرت رمز عبور:{" "}
                                            <span className={cn("font-medium", strength.textColor)}>
                                                {strength.label}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* confirm password */}
                            <div className="space-y-1.5">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--foreground)]">
                                    تکرار رمز عبور
                                </label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="رمز عبور را دوباره وارد کنید"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className={cn(
                                            "pr-9 pl-10",
                                            confirmPassword &&
                                                password !== confirmPassword &&
                                                "border-red-400 focus-visible:ring-red-300"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((s) => !s)}
                                        tabIndex={-1}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {confirmPassword && password === confirmPassword && (
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        رمز عبور مطابقت دارد
                                    </p>
                                )}
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-xs text-red-500">رمز عبور مطابقت ندارد</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setStep(1);
                                        setOtp("");
                                        setError("");
                                    }}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    بازگشت
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="flex-[2] h-11"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            در حال ثبت‌نام...
                                        </>
                                    ) : (
                                        "تکمیل ثبت‌نام"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
