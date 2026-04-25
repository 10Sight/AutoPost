import Razorpay from "razorpay";
import { config } from "../config/env.config.js";

/**
 * Service to handle Razorpay specific initialization and logic
 */
export class RazorpayService {
    static razorpay = null;

    static getRazorpay() {
        if (!this.razorpay && config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
            try {
                this.razorpay = new Razorpay({
                    key_id: config.RAZORPAY_KEY_ID,
                    key_secret: config.RAZORPAY_KEY_SECRET,
                });
            } catch (error) {
                console.error("Razorpay Initialization Error:", error);
                return null;
            }
        }
        return this.razorpay;
    }
}
