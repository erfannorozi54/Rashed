// OTP Service for generating and validating OTPs

export class OTPService {
    // Generate a 6-digit OTP
    static generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Get OTP expiration time (5 minutes from now)
    static getOTPExpiration(): Date {
        return new Date(Date.now() + 5 * 60 * 1000);
    }

    // Send OTP via SMS.ir verify API
    static async sendSMS(phone: string, otp: string, name?: string): Promise<boolean> {
        const apiKey = process.env.SMSIR_API_KEY;
        const templateId = process.env.SMSIR_TEMPLATE_ID;

        if (!apiKey || !templateId) {
            console.error("SMSIR_API_KEY or SMSIR_TEMPLATE_ID is not configured");
            return false;
        }

        // SMS.ir expects international format without leading zero (e.g. 989xxxxxxxxx)
        const mobile = phone.startsWith("0") ? `98${phone.slice(1)}` : phone;

        try {
            const response = await fetch("https://api.sms.ir/v1/send/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    mobile,
                    templateId: Number(templateId),
                    parameters: [
                        { name: "CODE", value: otp },
                        { name: "NAME", value: name || "کاربر" },
                    ],
                }),
            });

            if (!response.ok) {
                console.error(
                    `SMS.ir returned ${response.status}: ${await response.text()}`
                );
                return false;
            }

            return true;
        } catch (error) {
            console.error("Failed to reach SMS.ir:", error);
            return false;
        }
    }

    // Validate OTP
    static isOTPValid(
        storedOTP: string | null,
        providedOTP: string,
        expiresAt: Date | null
    ): { valid: boolean; message: string } {
        if (!storedOTP || !expiresAt) {
            return { valid: false, message: "کد تایید یافت نشد" };
        }

        if (new Date() > expiresAt) {
            return { valid: false, message: "کد تایید منقضی شده است" };
        }

        if (storedOTP !== providedOTP) {
            return { valid: false, message: "کد تایید اشتباه است" };
        }

        return { valid: true, message: "کد تایید معتبر است" };
    }

    // Validate phone number format (Iranian phone numbers)
    static isValidPhone(phone: string): boolean {
        // Iranian phone number: starts with 09 and has 11 digits
        const phoneRegex = /^09\d{9}$/;
        return phoneRegex.test(phone);
    }

    // Validate password strength
    static isValidPassword(password: string): {
        valid: boolean;
        message: string;
    } {
        if (password.length < 8) {
            return {
                valid: false,
                message: "رمز عبور باید حداقل ۸ کاراکتر باشد",
            };
        }

        const hasNumber = /\d/.test(password);
        const hasLetter = /[a-zA-Z]/.test(password);

        if (!hasNumber || !hasLetter) {
            return {
                valid: false,
                message: "رمز عبور باید شامل حروف و اعداد باشد",
            };
        }

        return { valid: true, message: "رمز عبور معتبر است" };
    }
}
