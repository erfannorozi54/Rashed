import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                phone: { label: "Phone", type: "tel" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.phone || !credentials?.password) {
                    throw new Error("شماره تلفن و رمز عبور الزامی است");
                }

                const user = await prisma.user.findUnique({
                    where: { phone: credentials.phone },
                });

                if (!user) {
                    throw new Error("کاربری با این شماره تلفن یافت نشد");
                }

                // OTP login path: consume the verified marker set by /api/auth/login-otp
                if (credentials.password === "OTP_LOGIN") {
                    if (
                        user.otp !== "VERIFIED" ||
                        !user.otpExpiresAt ||
                        new Date() > user.otpExpiresAt
                    ) {
                        throw new Error("کد تایید نامعتبر است. دوباره تلاش کنید");
                    }

                    await prisma.user.update({
                        where: { phone: credentials.phone },
                        data: { otp: null, otpExpiresAt: null, otpAttempts: 0 },
                    });

                    return {
                        id: user.id,
                        email: user.email || user.phone,
                        name: user.name,
                        role: user.role,
                    };
                }

                // Password login path
                if (!user.password) {
                    throw new Error("لطفاً از روش ورود با کد یکبار مصرف استفاده کنید");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("رمز عبور اشتباه است");
                }

                return {
                    id: user.id,
                    email: user.email || user.phone,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
