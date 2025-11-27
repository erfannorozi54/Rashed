"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BookOpen, Users, GraduationCap, TrendingUp } from "lucide-react";
import Script from "next/script";

export default function HomePage() {
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
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="border-b border-[var(--border)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-[var(--primary-600)]" />
                <span className="text-xl font-bold text-[var(--foreground)]">
                  آموزشگاه ریاضی راشد تبریز
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/blogs">
                  <Button variant="ghost">بلاگ</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline">ورود</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>ثبت‌نام</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[var(--primary-50)] via-white to-[var(--secondary-50)] py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--foreground)] leading-tight">
                  بهترین{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-[var(--primary-600)] to-[var(--secondary-600)]">
                    آموزشگاه ریاضی تبریز
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-[var(--muted-foreground)] leading-relaxed">
                  آموزشگاه ریاضی راشد - کلاس خصوصی ریاضی، آموزش ریاضی آنلاین و
                  حضوری، کلاس یوس (YOS) و آمادگی کنکور برای دانش‌آموزان ۷ تا ۱۸
                  سال در تبریز
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/auth/register">
                    <Button size="lg" className="text-base">
                      شروع یادگیری
                    </Button>
                  </Link>
                  <Link href="/blogs">
                    <Button size="lg" variant="outline" className="text-base">
                      مطالعه بلاگ‌ها
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[400px] md:h-[500px]">
                {/* Placeholder for hero image */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary-200)] to-[var(--secondary-200)] flex items-center justify-center">
                  <GraduationCap className="h-48 w-48 text-white opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
                چرا آموزشگاه ریاضی راشد تبریز؟
              </h2>
              <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                با بهترین روش‌های آموزش ریاضی و اساتید مجرب تبریز، مهارت‌های
                ریاضی خود را ارتقا دهید
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<BookOpen className="h-8 w-8" />}
                title="کلاس خصوصی ریاضی"
                description="تدریس خصوصی ریاضی با برنامه‌ریزی اختصاصی برای هر دانش‌آموز"
              />
              <FeatureCard
                icon={<Users className="h-8 w-8" />}
                title="اساتید مجرب تبریز"
                description="یادگیری از بهترین معلمان ریاضی تبریز با سابقه درخشان"
              />
              <FeatureCard
                icon={<GraduationCap className="h-8 w-8" />}
                title="کلاس یوس (YOS)"
                description="آمادگی کامل برای آزمون یوس ترکیه با اساتید متخصص"
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8" />}
                title="آموزش آنلاین و حضوری"
                description="کلاس‌های ریاضی آنلاین و حضوری با کیفیت بالا"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-l from-[var(--primary-600)] to-[var(--primary-700)] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              آماده شروع یادگیری هستید؟
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              همین حالا ثبت‌نام کنید و به جمع هزاران دانش‌آموز موفق بپیوندید
            </p>
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-white text-[var(--primary-600)] hover:bg-gray-100"
              >
                ثبت‌نام رایگان
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] bg-[var(--muted)] py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-6 w-6 text-[var(--primary-600)]" />
                  <span className="font-bold text-lg">
                    آموزشگاه ریاضی راشد تبریز
                  </span>
                </div>
                <p className="text-[var(--muted-foreground)] mb-2">
                  بهترین آموزشگاه ریاضی در تبریز
                </p>
                <p className="text-[var(--muted-foreground)] text-sm">
                  📍 تبریز، آذربایجان شرقی
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">خدمات آموزشی</h3>
                <ul className="space-y-2 text-[var(--muted-foreground)] text-sm">
                  <li>• کلاس خصوصی ریاضی</li>
                  <li>• آموزش ریاضی آنلاین</li>
                  <li>• کلاس یوس (YOS)</li>
                  <li>• آمادگی کنکور ریاضی</li>
                  <li>• المپیاد ریاضی</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">تماس با ما</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-2">
                  ایمیل: info@rashed-math.ir
                </p>
                <div className="mt-4">
                  <Link
                    href="/blogs"
                    className="text-[var(--primary-600)] hover:underline text-sm block mb-2"
                  >
                    بلاگ آموزش ریاضی
                  </Link>
                  <Link
                    href="/auth/login"
                    className="text-[var(--primary-600)] hover:underline text-sm block mb-2"
                  >
                    ورود به سیستم
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-[var(--primary-600)] hover:underline text-sm block"
                  >
                    ثبت‌نام در کلاس‌ها
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-[var(--border)] text-center text-[var(--muted-foreground)] text-sm">
              <p>© ۱۴۰۳ آموزشگاه ریاضی راشد تبریز. تمامی حقوق محفوظ است.</p>
              <p className="mt-2 text-xs">
                کلمات کلیدی: آموزش ریاضی، آموزشگاه ریاضی تبریز، کلاس خصوصی
                ریاضی، کلاس یوس، آموزشگاه راشد
              </p>
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-[var(--border)] bg-white hover:shadow-lg transition-shadow">
      <div className="mb-4 text-[var(--primary-600)]">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
        {title}
      </h3>
      <p className="text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}
