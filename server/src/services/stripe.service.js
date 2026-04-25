import Stripe from "stripe";
import { config } from "../config/env.config.js";

/**
 * Service to handle Stripe specific initialization and logic
 */
export class StripeService {
    static stripe = null;

    static getStripe() {
        if (!this.stripe && config.STRIPE_SECRET_KEY) {
            try {
                this.stripe = new Stripe(config.STRIPE_SECRET_KEY);
            } catch (error) {
                console.error("Stripe Initialization Error:", error);
                return null;
            }
        }
        return this.stripe;
    }
}
