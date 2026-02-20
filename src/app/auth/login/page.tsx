"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/ui/OtpInput";
import { cn } from "@/lib/utils";
import {
    GraduationCap,
    Phone,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    ShieldCheck,
    Zap,
    LayoutDashboard,
    ChevronLeft,
} from "lucide-react";

// ─── constants ───────────────────────────────────────────────────────────────

const TRUST_FEATURES = [
    { icon: ShieldCheck,      text: "امنیت کامل اطلاعات شما" },
    { icon: Zap,              text: "ورود سریع با کد یکبار مصرف" },
    { icon: LayoutDashboard,  text: "دسترسی فوری به داشبورد" },
];

// ─── form ────────────────────────────────────────────────────────────────────

function LoginForm() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const registered   = searchParams.get("registered") === "true";

    const [method, setMethod] = useState<"password" | "otp">("password");

    // password tab
    const [phone, setPhone]       = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd]   = useState(false);

    // otp tab
    const [otpPhone, setOtpPhone]   = useState("");
    const [otp, setOtp]             = useState("");
    const [otpSent, setOtpSent]     = useState(false);
    const [countdown, setCountdown] = useState(0);

    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    // ── handlers ──────────────────────────────────────────────────────────────

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await signIn("credentials", { phone, password, redirect: false });
            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
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
            const res  = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: otpPhone, purpose: "login" }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "خطا در ارسال کد تایید"); return; }
            setOtpSent(true);
            setCountdown(60);
        } catch {
            setError("خطا در ارسال کد تایید");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0 || loading) return;
        setError("");
        setLoading(true);
        try {
            const res  = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: otpPhone, purpose: "login" }),
            });
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

    const handleOTPLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (otp.length < 6) { setError("کد تایید را کامل وارد کنید"); return; }
        setLoading(true);
        try {
            const res  = await fetch("/api/auth/login-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: otpPhone, otp }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "خطا در ورود"); return; }

            const result = await signIn("credentials", {
                phone: otpPhone,
                password: "OTP_LOGIN",
                redirect: false,
            });
            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setError("خطا در ورود");
        } finally {
            setLoading(false);
        }
    };

    // ── render ────────────────────────────────────────────────────────────────

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
                            src="/images/auth/login-illustration.webp"
                            alt="تصویر ورود"
                            width={600}
                            height={390}
                            className="w-full h-auto mix-blend-multiply"
                            priority
                        />
                    </div>

                    {/* tagline */}
                    <h2 className="text-2xl font-bold mb-2 text-center leading-snug">
                        خوش آمدید
                    </h2>
                    <p className="text-[var(--primary-200)] text-sm text-center leading-relaxed mb-8">
                        با ورود به حساب کاربری به تمام امکانات آموزشی دسترسی داشته باشید
                    </p>

                    {/* trust features */}
                    <div className="space-y-3 w-full max-w-xs">
                        {TRUST_FEATURES.map((f, i) => (
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
                            ورود به حساب کاربری
                        </h1>
                        <p className="text-sm text-[var(--muted-foreground)]">
                            {registered
                                ? "ثبت‌نام شما با موفقیت انجام شد. وارد شوید"
                                : "حساب کاربری ندارید؟"}{" "}
                            {!registered && (
                                <Link
                                    href="/auth/register"
                                    className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium hover:underline"
                                >
                                    ثبت‌نام کنید
                                </Link>
                            )}
                        </p>
                    </div>

                    {/* success banner */}
                    {registered && (
                        <div className="mb-5 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                            ثبت‌نام با موفقیت انجام شد. اکنون می‌توانید وارد شوید
                        </div>
                    )}

                    {/* method tabs */}
                    <div className="flex gap-2 mb-6 p-1 bg-[var(--muted)] rounded-xl">
                        <button
                            type="button"
                            onClick={() => { setMethod("password"); setError(""); }}
                            className={cn(
                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                                method === "password"
                                    ? "bg-white text-[var(--foreground)] shadow-sm"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            )}
                        >
                            ورود با رمز عبور
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMethod("otp"); setError(""); }}
                            className={cn(
                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                                method === "otp"
                                    ? "bg-white text-[var(--foreground)] shadow-sm"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            )}
                        >
                            ورود با کد یکبار مصرف
                        </button>
                    </div>

                    {/* error */}
                    {error && (
                        <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
                            <span className="text-red-500 mt-0.5 leading-none">✕</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ── Password tab ── */}
                    {method === "password" && (
                        <form onSubmit={handlePasswordLogin} className="space-y-5">
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
                                        className="pr-9"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
                                    رمز عبور
                                </label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                                    <Input
                                        id="password"
                                        type={showPwd ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pr-9 pl-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd((s) => !s)}
                                        tabIndex={-1}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                                {loading ? (
                                    <><RefreshCw className="h-4 w-4 animate-spin" /> در حال ورود...</>
                                ) : (
                                    <>ورود <ChevronLeft className="h-4 w-4" /></>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* ── OTP tab ── */}
                    {method === "otp" && !otpSent && (
                        <form onSubmit={handleSendOTP} className="space-y-5">
                            <div className="space-y-1.5">
                                <label htmlFor="otpPhone" className="text-sm font-medium text-[var(--foreground)]">
                                    شماره تلفن همراه
                                </label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
                                    <Input
                                        id="otpPhone"
                                        type="tel"
                                        placeholder="09123456789"
                                        value={otpPhone}
                                        onChange={(e) => setOtpPhone(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pr-9"
                                        dir="ltr"
                                    />
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                    کد تایید به این شماره ارسال می‌شود
                                </p>
                            </div>

                            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                                {loading ? (
                                    <><RefreshCw className="h-4 w-4 animate-spin" /> در حال ارسال...</>
                                ) : (
                                    <>ارسال کد تایید <ChevronLeft className="h-4 w-4" /></>
                                )}
                            </Button>
                        </form>
                    )}

                    {method === "otp" && otpSent && (
                        <form onSubmit={handleOTPLogin} className="space-y-5">
                            <div className="p-3.5 rounded-xl bg-[var(--primary-50)] border border-[var(--primary-100)] text-[var(--primary-700)] text-sm leading-relaxed">
                                کد تایید به شماره{" "}
                                <span className="font-bold" dir="ltr">{otpPhone}</span>{" "}
                                ارسال شد
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-[var(--foreground)] block text-center">
                                    کد تایید ۶ رقمی را وارد کنید
                                </label>
                                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
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

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    تغییر شماره
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="flex-[2] h-11"
                                >
                                    {loading ? (
                                        <><RefreshCw className="h-4 w-4 animate-spin" /> در حال ورود...</>
                                    ) : "ورود"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-[var(--primary-600)]" />
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
