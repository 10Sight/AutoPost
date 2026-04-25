import { RazorpayService } from "../services/razorpay.service.js";
import { StripeService } from "../services/stripe.service.js";
import { BillingService } from "../services/billing.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";
import { config } from "../config/env.config.js";

/**
 * Controller to handle multi-gateway Billing (Razorpay & Stripe)
 */

// --- RAZORPAY HANDLERS ---

export const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { plan } = req.body;
    const organization = req.organization;

    const rzp = RazorpayService.getRazorpay();
    if (!rzp) throw new ApiError(500, "Razorpay service is not configured");

    const amount = plan === 'pro' ? 249900 : 999900; 

    try {
        const order = await rzp.orders.create({
            amount,
            currency: "INR",
            receipt: `rcpt_${organization._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
            notes: { organizationId: organization._id.toString(), plan }
        });

        return res.status(200).json(new ApiResponse(200, {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: config.RAZORPAY_KEY_ID,
            orgName: organization.name,
            userEmail: req.user.email
        }, "Razorpay order created"));
    } catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        throw new ApiError(500, error?.message || "Failed to create payment order");
    }
});

export const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    const generated_signature = crypto
        .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (generated_signature !== razorpay_signature) {
        throw new ApiError(400, "Invalid payment signature");
    }

    // Unified Service Call
    await BillingService.upgradeOrganizationPlan(
        req.organization._id, 
        plan, 
        "razorpay", 
        { paymentId: razorpay_payment_id }
    );

    return res.status(200).json(new ApiResponse(200, {}, "Plan upgraded successfully"));
});

// --- STRIPE HANDLERS ---

export const createStripeCheckout = asyncHandler(async (req, res) => {
    const { plan } = req.body;
    const stripe = StripeService.getStripe();
    if (!stripe) throw new ApiError(500, "Stripe service not configured");

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: `${plan.toUpperCase()} Plan Subscription` },
                    unit_amount: plan === 'pro' ? 2900 : 9900,
                    recurring: { interval: 'month' },
                },
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${config.FRONTEND_URL}/dashboard/org-settings?success=true`,
            cancel_url: `${config.FRONTEND_URL}/dashboard/org-settings?success=false`,
            client_reference_id: req.organization._id.toString(),
            metadata: { plan }
        });

        return res.status(200).json(new ApiResponse(200, { url: session.url }, "Stripe session created"));
    } catch (error) {
        console.error("Stripe Checkout Session Error:", error);
        throw new ApiError(500, error?.message || "Stripe checkout failed");
    }
});

// --- WEBHOOKS ---

export const razorpayWebhook = asyncHandler(async (req, res) => {
    const secret = config.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (signature !== expectedSignature) return res.status(400).send("Invalid signature");

    const { event, payload } = req.body;
    if (event === "payment.captured") {
        const notes = payload.payment.entity.notes;
        await BillingService.upgradeOrganizationPlan(
            notes.organizationId, 
            notes.plan, 
            "razorpay", 
            { paymentId: payload.payment.entity.id }
        );
    }
    res.status(200).json({ status: "ok" });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
    const stripe = StripeService.getStripe();
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        await BillingService.upgradeOrganizationPlan(
            session.client_reference_id, 
            session.metadata.plan, 
            "stripe", 
            { subscriptionId: session.subscription }
        );
    }
    res.status(200).json({ received: true });
});
