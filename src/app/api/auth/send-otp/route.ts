import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OTPService } from "@/lib/services/otp.service";

const OTP_TTL_MS = 5 * 60 * 1000;   // 5 minutes
const OTP_COOLDOWN_MS = 60 * 1000;   // 1 minute
const OTP_REUSE_AFTER_MS = 3 * 60 * 1000; // reuse window: sent 3+ min ago but still valid

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, purpose, firstName } = body;

        if (!phone) {
            return NextResponse.json(
                { error: "شماره تلفن الزامی است" },
                { status: 400 }
            );
        }

        if (!OTPService.isValidPhone(phone)) {
            return NextResponse.json(
                { error: "فرمت شماره تلفن صحیح نیست" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });

        if (purpose === "register" && existingUser && existingUser.password) {
            return NextResponse.json(
                { error: "این شماره تلفن قبلاً ثبت شده است" },
                { status: 400 }
            );
        }

        if (purpose === "login" && !existingUser) {
            return NextResponse.json(
                { error: "حساب کاربری با این شماره تلفن وجود ندارد. لطفاً ابتدا ثبت‌نام کنید" },
                { status: 404 }
            );
        }

        const now = Date.now();

        // Rate limit: if OTP was sent less than 1 minute ago, reject
        if (existingUser?.otpExpiresAt) {
            const sentAt = existingUser.otpExpiresAt.getTime() - OTP_TTL_MS;
            if (now - sentAt < OTP_COOLDOWN_MS) {
                const remaining = Math.ceil((OTP_COOLDOWN_MS - (now - sentAt)) / 1000);
                return NextResponse.json(
                    { error: `لطفاً ${remaining} ثانیه صبر کنید` },
                    { status: 429 }
                );
            }
        }

        // Reuse existing OTP if still valid and sent 1-5 min ago
        let otp: string;
        let otpExpiresAt: Date;

        if (
            existingUser?.otp &&
            existingUser.otpExpiresAt &&
            existingUser.otpExpiresAt.getTime() > now
        ) {
            // OTP still valid — reuse it
            otp = existingUser.otp;
            otpExpiresAt = existingUser.otpExpiresAt;
        } else {
            // Generate new OTP
            otp = OTPService.generateOTP();
            otpExpiresAt = OTPService.getOTPExpiration();
        }

        // Save OTP (create user for new registrations, update for existing)
        if (purpose === "register" && !existingUser) {
            await prisma.user.create({
                data: {
                    phone,
                    firstName: "",
                    lastName: "",
                    name: "",
                    otp,
                    otpExpiresAt,
                    otpAttempts: 0,
                },
            });
        } else {
            await prisma.user.update({
                where: { phone },
                data: { otp, otpExpiresAt, otpAttempts: 0 },
            });
        }

        // Send SMS
        const userName = firstName || existingUser?.firstName || "کاربر";
        const smsSent = await OTPService.sendSMS(phone, otp, userName);

        if (!smsSent) {
            return NextResponse.json(
                { error: "خطا در ارسال پیامک" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: "کد تایید با موفقیت ارسال شد",
                expiresAt: otpExpiresAt,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Send OTP error:", error);
        return NextResponse.json(
            { error: "خطا در ارسال کد تایید" },
            { status: 500 }
        );
    }
}
