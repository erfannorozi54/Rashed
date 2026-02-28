import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { OTPService } from "@/lib/services/otp.service";
import { Role } from "@prisma/client";

const ADMIN_PHONE = process.env.ADMIN_PHONE ?? "";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { firstName, lastName, phone, otp, password } = body;

        // Validate required fields
        if (!firstName || !lastName || !phone || !otp || !password) {
            return NextResponse.json(
                { error: "تمام فیلدها الزامی هستند" },
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

        // Validate password
        const passwordValidation = OTPService.isValidPassword(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { error: passwordValidation.message },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });

        if (existingUser && existingUser.password) {
            return NextResponse.json(
                { error: "این شماره تلفن قبلاً ثبت شده است" },
                { status: 400 }
            );
        }

        // If user exists (from send-otp), validate OTP
        if (existingUser) {
            const otpValidation = OTPService.isOTPValid(
                existingUser.otp,
                otp,
                existingUser.otpExpiresAt
            );

            if (!otpValidation.valid) {
                // Increment OTP attempts
                await prisma.user.update({
                    where: { phone },
                    data: {
                        otpAttempts: existingUser.otpAttempts + 1,
                    },
                });

                return NextResponse.json(
                    { error: otpValidation.message },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "لطفاً ابتدا کد تایید را درخواست کنید" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Determine role: ADMIN for hardcoded phone, otherwise STUDENT
        const userRole = phone === ADMIN_PHONE ? Role.ADMIN : Role.STUDENT;

        // Update user with registration data
        const user = await prisma.user.update({
            where: { phone },
            data: {
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                password: hashedPassword,
                role: userRole,
                otp: null, // Clear OTP after successful verification
                otpExpiresAt: null,
                otpAttempts: 0,
            },
        });

        return NextResponse.json(
            {
                message: "ثبت‌نام با موفقیت انجام شد",
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Verify OTP error:", error);
        return NextResponse.json(
            { error: "خطا در تایید کد. لطفاً دوباره تلاش کنید" },
            { status: 500 }
        );
    }
}
