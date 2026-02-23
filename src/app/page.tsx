"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import {
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Target,
  Award,
  Clock,
  ChevronDown,
} from "lucide-react";
import Script from "next/script";

export default function HomePage() {
  const { data: session, status } = useSession();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        // Calculate opacity for the hero overlay based on scroll
        const opacity = Math.min(scrollY / (windowHeight * 0.5), 1);
        document.documentElement.style.setProperty('--scroll-opacity', String(opacity));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "آموزشگاه ریاضی راشد تبریز",
    alternateName: "موسسه ریاضی راشد",
    description:
      "بهترین آموزشگاه ریاضی در تبریز. کلاس خصوصی ریاضی، آموزش ریاضی آنلاین و حضوری، کلاس یوس (YOS)، آمادگی کنکور و المپیاد ریاضی",
    url: "https://rashed-math.ir",
    telephone: "+98-XXX-XXX-XXXX",
    email: "info@rashed-math.ir",
    address: {
      "@type": "PostalAddress",
      addressLocality: "تبریز",
      addressRegion: "آذربایجان شرقی",
      addressCountry: "IR",
    },
    areaServed: {
      "@type": "City",
      name: "تبریز",
    },
    offers: [
      {
        "@type": "Offer",
        name: "کلاس خصوصی ریاضی",
        description: "تدریس خصوصی ریاضی توسط اساتید مجرب",
      },
      {
        "@type": "Offer",
        name: "کلاس یوس (YOS)",
        description: "آمادگی آزمون یوس ترکیه",
      },
      {
        "@type": "Offer",
        name: "آموزش ریاضی آنلاین",
        description: "کلاس‌های آنلاین ریاضی با کیفیت بالا",
      },
    ],
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Fixed Full-Screen Hero with Background Image */}
      <section
        className="fixed inset-0 w-full h-screen z-0"
        style={{
          backgroundImage: "url('/images/image-Photoroom.png')",
          backgroundSize: "contain",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#faf5ff",
        }}
      >
        {/* Animated background for visual appeal */}
        <AnimatedBackground />

        {/* Hero Content - Positioned on the right (empty side of image) */}
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-xl mr-auto lg:mr-0 lg:ml-auto text-center lg:text-right">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[var(--primary-200)] rounded-full px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4 text-[var(--primary-600)]" />
                <span className="text-sm font-medium text-[var(--primary-700)]">
                  بهترین آموزشگاه ریاضی تبریز
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[var(--foreground)] leading-tight mb-6">
                یادگیری ریاضی
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-[var(--primary-600)] via-[var(--primary-500)] to-[var(--secondary-500)]">
                  آسان و لذت‌بخش
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-[var(--muted-foreground)] leading-relaxed mb-8">
                با روش‌های نوین آموزشی و اساتید مجرب، ریاضی را به شکلی متفاوت
                تجربه کنید. کلاس‌های خصوصی، آنلاین و حضوری برای تمام مقاطع
              </p>

              {/* Features list */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-4 text-sm mb-8">
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-[var(--primary-600)]" />
                  <span className="text-[var(--foreground)]">کلاس خصوصی</span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-[var(--primary-600)]" />
                  <span className="text-[var(--foreground)]">آموزش آنلاین</span>
                </div>
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-[var(--primary-600)]" />
                  <span className="text-[var(--foreground)]">کلاس یوس</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
                {status === "authenticated" ? (
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="text-base px-8 shadow-xl shadow-[var(--primary-600)]/30 hover:shadow-2xl hover:shadow-[var(--primary-600)]/40 transition-all duration-300"
                    >
                      رفتن به داشبورد
                      <ArrowLeft className="h-5 w-5 mr-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/register">
                    <Button
                      size="lg"
                      className="text-base px-8 shadow-xl shadow-[var(--primary-600)]/30 hover:shadow-2xl hover:shadow-[var(--primary-600)]/40 transition-all duration-300"
                    >
                      شروع یادگیری
                      <ArrowLeft className="h-5 w-5 mr-2" />
                    </Button>
                  </Link>
                )}
                <Link href="/classes">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base px-8 border-2 bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  >
                    مشاهده کلاسها
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-8">
                <div className="text-center lg:text-right bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl">
                  <div className="text-2xl md:text-3xl font-bold text-[var(--primary-600)]">
                    +۵۰۰
                  </div>
                  <div className="text-xs md:text-sm text-[var(--muted-foreground)]">
                    دانش‌آموز موفق
                  </div>
                </div>
                <div className="text-center lg:text-right bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl">
                  <div className="text-2xl md:text-3xl font-bold text-[var(--primary-600)]">
                    +۱۰
                  </div>
                  <div className="text-xs md:text-sm text-[var(--muted-foreground)]">
                    سال تجربه
                  </div>
                </div>
                <div className="text-center lg:text-right bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl">
                  <div className="text-2xl md:text-3xl font-bold text-[var(--primary-600)]">
                    ۹۸٪
                  </div>
                  <div className="text-xs md:text-sm text-[var(--muted-foreground)]">
                    رضایت والدین
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer group"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
              اسکرول کنید
            </span>
            <div className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-[var(--primary-200)]">
              <ChevronDown className="h-5 w-5 text-[var(--primary-600)]" />
            </div>
          </div>
        </button>
      </section>

      {/* Spacer to allow scrolling past the fixed hero */}
      <div className="h-screen"></div>

      {/* Main Content - Slides up over the hero */}
      <div
        ref={contentRef}
        className="relative z-10 bg-white rounded-t-[2rem] md:rounded-t-[3rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.15)]"
      >
        {/* Navigation - Now inside the sliding content */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 rounded-t-[2rem] md:rounded-t-[3rem]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] rounded-xl blur-sm opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] p-2 rounded-xl">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-bold text-[var(--foreground)]">
                    آموزشگاه راشد
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] hidden sm:block">
                    مرکز تخصصی ریاضیات تبریز
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <Link href="/blogs" className="hidden sm:block">
                  <Button variant="ghost" className="text-sm">
                    بلاگ
                  </Button>
                </Link>
                {status === "loading" ? (
                  <div className="w-24 h-9 rounded-lg bg-gray-100 animate-pulse" />
                ) : status === "authenticated" ? (
                  <>
                    <span className="hidden sm:block text-sm text-[var(--muted-foreground)] font-medium">
                      {session.user?.name}
                    </span>
                    <Link href="/dashboard">
                      <Button className="text-sm shadow-lg shadow-[var(--primary-600)]/25">
                        داشبورد
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost" className="text-sm">
                        ورود
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button className="text-sm shadow-lg shadow-[var(--primary-600)]/25">
                        ثبت‌نام رایگان
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Features Section */}
        <section className="py-24 bg-gradient-to-b from-white to-[var(--muted)]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-[var(--secondary-50)] border border-[var(--secondary-200)] rounded-full px-4 py-2 mb-6">
                <Target className="h-4 w-4 text-[var(--secondary-600)]" />
                <span className="text-sm font-medium text-[var(--secondary-700)]">
                  چرا آموزشگاه راشد؟
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-6">
                مزایای یادگیری در{" "}
                <span className="text-[var(--primary-600)]">آموزشگاه راشد</span>
              </h2>
              <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                با بهترین روش‌های آموزش ریاضی و اساتید مجرب تبریز، مهارت‌های
                ریاضی خود را ارتقا دهید
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<BookOpen className="h-7 w-7" />}
                title="کلاس خصوصی ریاضی"
                description="تدریس خصوصی با برنامه‌ریزی اختصاصی برای هر دانش‌آموز"
                color="primary"
              />
              <FeatureCard
                icon={<Users className="h-7 w-7" />}
                title="اساتید مجرب"
                description="یادگیری از بهترین معلمان ریاضی تبریز با سابقه درخشان"
                color="secondary"
              />
              <FeatureCard
                icon={<GraduationCap className="h-7 w-7" />}
                title="کلاس یوس (YOS)"
                description="آمادگی کامل برای آزمون یوس ترکیه با اساتید متخصص"
                color="primary"
              />
              <FeatureCard
                icon={<TrendingUp className="h-7 w-7" />}
                title="آموزش آنلاین"
                description="کلاس‌های ریاضی آنلاین و حضوری با کیفیت بالا"
                color="secondary"
              />
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24 bg-[var(--muted)]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-white border border-[var(--border)] rounded-full px-4 py-2">
                  <Award className="h-4 w-4 text-[var(--primary-600)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    خدمات آموزشی
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
                  دوره‌های تخصصی ریاضی
                  <br />
                  <span className="text-[var(--primary-600)]">
                    برای همه مقاطع
                  </span>
                </h2>
                <p className="text-lg text-[var(--muted-foreground)]">
                  از دبستان تا دانشگاه، ما در کنار شما هستیم. با دوره‌های متنوع
                  و روش‌های نوین آموزشی، ریاضی را به زبان ساده یاد بگیرید.
                </p>

                <div className="space-y-4">
                  <ServiceItem
                    icon={<Clock className="h-5 w-5" />}
                    title="کلاس‌های منعطف"
                    description="زمان‌بندی متناسب با برنامه شما"
                  />
                  <ServiceItem
                    icon={<Target className="h-5 w-5" />}
                    title="آموزش هدفمند"
                    description="تمرکز بر نقاط ضعف و تقویت آن‌ها"
                  />
                  <ServiceItem
                    icon={<Award className="h-5 w-5" />}
                    title="تضمین کیفیت"
                    description="بازگشت وجه در صورت عدم رضایت"
                  />
                </div>

                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="shadow-lg shadow-[var(--primary-600)]/25"
                  >
                    مشاوره رایگان
                    <ArrowLeft className="h-5 w-5 mr-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <CourseCard
                    title="ریاضی دبستان"
                    level="پایه اول تا ششم"
                    color="primary"
                  />
                  <CourseCard
                    title="ریاضی دبیرستان"
                    level="پایه هفتم تا دوازدهم"
                    color="secondary"
                  />
                </div>
                <div className="space-y-4 mt-8">
                  <CourseCard
                    title="کنکور ریاضی"
                    level="آمادگی کنکور سراسری"
                    color="secondary"
                  />
                  <CourseCard
                    title="آزمون یوس"
                    level="YOS ترکیه"
                    color="primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-[var(--primary-600)] via-[var(--primary-700)] to-[var(--primary-800)]"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                آماده شروع یادگیری هستید؟
              </h2>
              <p className="text-lg md:text-xl mb-10 opacity-90">
                همین حالا ثبت‌نام کنید و اولین جلسه مشاوره رایگان خود را رزرو
                کنید
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="bg-white text-[var(--primary-700)] hover:bg-gray-100 shadow-xl text-base px-8"
                  >
                    ثبت‌نام رایگان
                    <ArrowLeft className="h-5 w-5 mr-2" />
                  </Button>
                </Link>
                <Link href="/blogs">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 text-base px-8"
                  >
                    مشاهده بلاگ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[var(--foreground)] text-white py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] p-2 rounded-xl">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-xl">آموزشگاه راشد</span>
                    <p className="text-sm text-gray-400">
                      مرکز تخصصی ریاضیات تبریز
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 mb-4 max-w-md">
                  بهترین آموزشگاه ریاضی در تبریز با بیش از ۱۰ سال سابقه در آموزش
                  ریاضی به دانش‌آموزان تمام مقاطع
                </p>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  تبریز، آذربایجان شرقی
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-6">خدمات آموزشی</h3>
                <ul className="space-y-3 text-gray-400">
                  <li className="hover:text-white transition-colors cursor-pointer">
                    کلاس خصوصی ریاضی
                  </li>
                  <li className="hover:text-white transition-colors cursor-pointer">
                    آموزش ریاضی آنلاین
                  </li>
                  <li className="hover:text-white transition-colors cursor-pointer">
                    کلاس یوس (YOS)
                  </li>
                  <li className="hover:text-white transition-colors cursor-pointer">
                    آمادگی کنکور ریاضی
                  </li>
                  <li className="hover:text-white transition-colors cursor-pointer">
                    المپیاد ریاضی
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-6">دسترسی سریع</h3>
                <ul className="space-y-3 text-gray-400">
                  <li>
                    <Link
                      href="/blogs"
                      className="hover:text-white transition-colors"
                    >
                      بلاگ آموزشی
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/login"
                      className="hover:text-white transition-colors"
                    >
                      ورود به سیستم
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/register"
                      className="hover:text-white transition-colors"
                    >
                      ثبت‌نام
                    </Link>
                  </li>
                </ul>
                <div className="mt-6">
                  <p className="text-gray-400 text-sm">ایمیل:</p>
                  <p className="text-white">info@rashed-math.ir</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
              <p>© ۱۴۰۳ آموزشگاه ریاضی راشد تبریز. تمامی حقوق محفوظ است.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "primary" | "secondary";
}) {
  const colorClasses = {
    primary: {
      bg: "bg-[var(--primary-50)]",
      icon: "text-[var(--primary-600)]",
      border: "border-[var(--primary-100)]",
      hover: "hover:border-[var(--primary-200)]",
    },
    secondary: {
      bg: "bg-[var(--secondary-50)]",
      icon: "text-[var(--secondary-600)]",
      border: "border-[var(--secondary-100)]",
      hover: "hover:border-[var(--secondary-200)]",
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`group p-6 rounded-2xl border-2 ${colors.border} ${colors.hover} bg-white hover:shadow-xl transition-all duration-300`}
    >
      <div
        className={`mb-5 ${colors.bg} ${colors.icon} w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-[var(--foreground)]">
        {title}
      </h3>
      <p className="text-[var(--muted-foreground)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function ServiceItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[var(--border)] hover:shadow-md transition-shadow">
      <div className="bg-[var(--primary-50)] text-[var(--primary-600)] p-2 rounded-lg">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-[var(--foreground)]">{title}</h4>
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

function CourseCard({
  title,
  level,
  color,
}: {
  title: string;
  level: string;
  color: "primary" | "secondary";
}) {
  const colorClasses = {
    primary: "from-[var(--primary-500)] to-[var(--primary-700)]",
    secondary: "from-[var(--secondary-500)] to-[var(--secondary-700)]",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow`}
    >
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className="text-sm opacity-90">{level}</p>
    </div>
  );
}
