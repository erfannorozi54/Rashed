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

    // Mock SMS sending - prints OTP to console
    static async sendSMS(phone: string, otp: string): Promise<boolean> {
        console.log("\n" + "=".repeat(50));
        console.log("📱 MOCK SMS SERVICE");
        console.log("=".repeat(50));
        console.log(`Phone: ${phone}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Expires: ${this.getOTPExpiration().toLocaleString("fa-IR")}`);
        console.log("=".repeat(50) + "\n");

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        // In production, replace this with actual SMS API call:
        // const response = await fetch('YOUR_SMS_API_URL', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ phone, message: `کد تایید شما: ${otp}` })
        // });
        // return response.ok;

        return true; // Mock success
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
