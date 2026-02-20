import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OTPService } from "@/lib/services/otp.service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, otp } = body;

        if (!phone || !otp) {
            return NextResponse.json(
                { error: "شماره تلفن و کد تایید الزامی هستند" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        if (!user) {
            return NextResponse.json(
                { error: "کاربری با این شماره تلفن یافت نشد" },
                { status: 404 }
            );
        }

        // Validate OTP
        const otpValidation = OTPService.isOTPValid(
            user.otp,
            otp,
            user.otpExpiresAt
        );

        if (!otpValidation.valid) {
            // Increment OTP attempts
            await prisma.user.update({
                where: { phone },
                data: {
                    otpAttempts: user.otpAttempts + 1,
                },
            });

            return NextResponse.json(
                { error: otpValidation.message },
                { status: 400 }
            );
        }

        // Mark OTP as verified — NextAuth authorize will consume this marker within 30 seconds
        await prisma.user.update({
            where: { phone },
            data: {
                otp: "VERIFIED",
                otpExpiresAt: new Date(Date.now() + 30 * 1000),
                otpAttempts: 0,
            },
        });

        return NextResponse.json(
            {
                message: "ورود با موفقیت انجام شد",
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Login OTP error:", error);
        return NextResponse.json(
            { error: "خطا در ورود. لطفاً دوباره تلاش کنید" },
            { status: 500 }
        );
    }
}
