import Stripe from "stripe";
import { config } from "../config/env.config.js";

/**
 * Service to handle Stripe specific initialization and logic
 */
export class StripeService {
    static stripe = null;

    /**
     * Get default payment method for a customer
     */
    static async getDefaultPaymentMethod(customerId) {
        const stripe = this.getStripe();
        if (!stripe || !customerId) return null;

        const customer = await stripe.customers.retrieve(customerId, {
            expand: ['invoice_settings.default_payment_method']
        });

        if (customer.invoice_settings?.default_payment_method) {
            const pm = customer.invoice_settings.default_payment_method;
            return {
                brand: pm.card.brand,
                last4: pm.card.last4,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year,
                type: 'stripe'
            };
        }
        return null;
    }

    static getStripe() {
        if (!this.stripe && config.STRIPE_SECRET_KEY) {
            try {
                this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
                    apiVersion: "2023-10-16",
                });
            } catch (error) {
                console.error("Stripe Initialization Error:", error);
                return null;
            }
        }
        return this.stripe;
    }

    /**
     * Create or retrieve a Stripe Customer
     */
    static async getOrCreateCustomer(organization) {
        const stripe = this.getStripe();
        if (!stripe) throw new Error("Stripe is not configured");

        if (organization.billing?.stripeCustomerId) {
            return organization.billing.stripeCustomerId;
        }

        const customer = await stripe.customers.create({
            email: organization.adminEmail || `admin@${organization.slug}.com`,
            name: organization.name,
            metadata: {
                organizationId: organization._id.toString(),
            },
        });

        // Save back to organization
        const { Organization } = await import("../models/organization.model.js");
        await Organization.findByIdAndUpdate(organization._id, {
            "billing.stripeCustomerId": customer.id,
        });

        return customer.id;
    }

    /**
     * Create a checkout session for a subscription
     */
    static async createCheckoutSession(organization, planId, successUrl, cancelUrl) {
        const stripe = this.getStripe();
        const customerId = await this.getOrCreateCustomer(organization);

        return await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ["card"],
            line_items: [
                {
                    price: planId, // Stripe Price ID (e.g. price_123...)
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                organizationId: organization._id.toString(),
            },
        });
    }

    /**
     * Cancel a subscription at the end of the period
     */
    static async cancelSubscription(customerId) {
        const stripe = this.getStripe();
        if (!stripe) return null;

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length > 0) {
            return await stripe.subscriptions.update(subscriptions.data[0].id, {
                cancel_at_period_end: true
            });
        }
        return null;
    }

    /**
     * Verify and construct a webhook event
     */
    static constructEvent(payload, signature) {
        const stripe = this.getStripe();
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            config.STRIPE_WEBHOOK_SECRET
        );
    }
}
