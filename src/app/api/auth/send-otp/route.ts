import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OTPService } from "@/lib/services/otp.service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, purpose, firstName } = body; // purpose: 'register' or 'login'

        if (!phone) {
            return NextResponse.json(
                { error: "شماره تلفن الزامی است" },
                { status: 400 }
            );
        }

        // Validate phone format
        if (!OTPService.isValidPhone(phone)) {
            return NextResponse.json(
                { error: "فرمت شماره تلفن صحیح نیست" },
                { status: 400 }
            );
        }

        // Check if user exists based on purpose
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
                { error: "کاربری با این شماره تلفن یافت نشد" },
                { status: 404 }
            );
        }

        // Generate OTP
        const otp = OTPService.generateOTP();
        const otpExpiresAt = OTPService.getOTPExpiration();

        // For registration, create or update user with OTP
        if (purpose === "register") {
            if (existingUser) {
                // Update existing incomplete user
                await prisma.user.update({
                    where: { phone },
                    data: {
                        otp,
                        otpExpiresAt,
                        otpAttempts: 0,
                    },
                });
            } else {
                // Create new user with OTP (incomplete registration)
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
            }
        }

        // For login, update existing user's OTP
        if (purpose === "login" && existingUser) {
            await prisma.user.update({
                where: { phone },
                data: {
                    otp,
                    otpExpiresAt,
                    otpAttempts: 0,
                },
            });
        }

        // Send OTP via SMS
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
