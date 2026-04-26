import RazorpayPkg from "razorpay";
import crypto from "crypto";

const Razorpay = RazorpayPkg.default || RazorpayPkg;

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env");
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "MOCK_KEY",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "MOCK_SECRET",
});

export class RazorpayService {
    static async createOrder(amount, currency = "INR", receipt) {
        try {
            const options = {
                amount: amount * 100, // amount in smallest currency unit
                currency,
                receipt,
            };
            return await razorpay.orders.create(options);
        } catch (error) {
            console.error("[Razorpay Service Error]", error);
            const errorMsg = error.description || error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            throw new Error(errorMsg);
        }
    }

    static verifySignature(orderId, paymentId, signature) {
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");
        return expectedSignature === signature;
    }
}
