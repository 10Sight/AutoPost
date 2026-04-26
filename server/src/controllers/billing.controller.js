import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Organization } from "../models/organization.model.js";
import { StripeService } from "../services/stripe.service.js";
import { RazorpayService } from "../services/razorpay.service.js";
import { BillingService } from "../services/billing.service.js";
import { Usage } from "../models/usage.model.js";
import { Invoice } from "../models/invoice.model.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import { logger } from "../utils/logger.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";

/**
 * @desc    Create Stripe Checkout Session
 * @route   POST /api/v1/billing/stripe/create-session
 */
const createStripeSession = asyncHandler(async (req, res) => {
    const { planName, billingCycle } = req.body;

    if (!planName) {
        console.error("[Stripe Error] Missing planName in request body:", req.body);
        throw new ApiError(400, "Plan name is required");
    }

    const org = await Organization.findById(req.user.organizationId);

    if (!org) throw new ApiError(404, "Organization not found");

    let normalizedPlan = String(planName).toLowerCase();
    if (normalizedPlan === 'professional') normalizedPlan = 'pro';

    console.log(`[Billing Debug] Original: ${planName}, Normalized: ${normalizedPlan}`);
    
    if (!BillingService.PLAN_LIMITS[normalizedPlan]) {
        console.error(`[Billing Error] Plan limits not found for normalized key: "${normalizedPlan}"`);
        throw new ApiError(400, "Invalid plan");
    }
    const cycleSuffix = billingCycle === 'yearly' ? '_YEARLY' : '_MONTHLY';
    const priceId = process.env[`STRIPE_PRICE_ID_${normalizedPlan.toUpperCase()}${cycleSuffix}`] || 
                    process.env[`STRIPE_PRICE_ID_${normalizedPlan.toUpperCase()}`]; // Fallback to legacy

    if (!priceId) throw new ApiError(400, "Invalid plan or billing cycle selected");

    // Prevent duplicate purchase or downgrade
    const currentPlan = org.billing?.plan || 'free';
    const planPriority = { free: 0, pro: 1, enterprise: 2 };

    if (planPriority[normalizedPlan] <= planPriority[currentPlan]) {
        throw new ApiError(400, `You are already on the ${currentPlan} plan or a higher tier.`);
    }

    const session = await StripeService.createCheckoutSession(
        org,
        priceId,
        `${process.env.FRONTEND_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
        `${process.env.FRONTEND_URL}/dashboard/billing?status=cancel`
    );

    return res
        .status(200)
        .json(new ApiResponse(200, { url: session.url }, "Checkout session created"));
});

/**
 * @desc    Handle Stripe Webhook Events
 * @route   POST /api/v1/billing/stripe/webhook
 */
const handleStripeWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = StripeService.constructEvent(req.body, sig);
    } catch (err) {
        logger.error(`[Stripe Webhook] Signature Verification Failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process high-level event types
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const organizationId = session.metadata.organizationId;
            
            // In a real app, you'd fetch the line items to know which plan was bought
            // For now, we assume metadata or a lookup table
            logger.info(`[Stripe Webhook] Checkout completed for Org: ${organizationId}`);
            break;
        }

        case "invoice.paid": {
            const invoice = event.data.object;
            const subscriptionId = invoice.subscription;
            const customerId = invoice.customer;

            // Find organization by customerId or subscriptionId
            const org = await Organization.findOne({ 
                $or: [
                    { "billing.stripeCustomerId": customerId },
                    { "billing.stripeSubscriptionId": subscriptionId }
                ]
            });

            if (org) {
                // Determine plan from metadata or subscription record
                const planName = invoice.lines.data[0]?.metadata?.plan || "pro"; 
                const amount = invoice.total;
                
                await BillingService.upgradeOrganizationPlan(org._id, planName, "stripe", {
                    subscriptionId,
                    paymentId: invoice.payment_intent,
                    currentPeriodEnd: new Date(invoice.lines.data[0]?.period?.end * 1000)
                });

                // Trigger automated invoicing
                await BillingService.processSuccessfulPayment(org._id, {
                    planName,
                    amount,
                    invoiceId: invoice.id
                });

                logger.info(`[Stripe Webhook] Payment confirmed and quotas synced for Org: ${org._id}`);
            }
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object;
            const org = await Organization.findOne({ "billing.stripeSubscriptionId": subscription.id });
            
            if (org) {
                await Organization.findByIdAndUpdate(org._id, {
                    "billing.subscriptionStatus": "canceled",
                    "billing.plan": "free"
                });
                await BillingService.syncOrganizationQuotas(org._id);
                logger.warn(`[Stripe Webhook] Subscription canceled for Org: ${org._id}`);
            }
            break;
        }

        default:
            logger.debug(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
});

/**
 * @desc    Get current billing status and limits
 * @route   GET /api/v1/billing/status
 */
const getBillingStatus = asyncHandler(async (req, res) => {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) throw new ApiError(404, "Organization not found");

    const usage = await Usage.findOne({ organizationId: org._id });
    const invoices = await Invoice.find({ organizationId: org._id })
        .sort({ billingDate: -1 })
        .limit(10);

    const planLimits = BillingService.PLAN_LIMITS[org.billing?.plan || "free"];

    let paymentMethod = null;
    if (org.billing?.stripeCustomerId) {
        paymentMethod = await StripeService.getDefaultPaymentMethod(org.billing.stripeCustomerId);
    } else if (org.billing?.razorpayCustomerId || invoices.length > 0) {
        // Fallback for Razorpay users - usually we don't have a saved card 
        // unless using subscriptions, so we'll just indicate it's Razorpay
        paymentMethod = {
            type: 'razorpay',
            brand: 'Razorpay',
            last4: '••••',
            expMonth: '--',
            expYear: '--'
        };
    }

    return res.status(200).json(new ApiResponse(200, {
        plan: org.billing?.plan,
        status: org.billing?.status || org.billing?.subscriptionStatus,
        billingCycle: org.billing?.billingCycle || 'monthly',
        expiry: org.billing?.currentPeriodEnd,
        paymentMethod,
        // Profile Info
        taxId: org.billing?.taxId || "",
        companyName: org.billing?.companyName || org.name,
        address: org.billing?.address || "",
        limits: {
            ...planLimits,
            postsUsed: usage?.postsUsed || 0,
            accountsUsed: usage?.platformsUsed || 0,
            storageUsed: usage?.storageUsedBytes || 0
        },
        history: invoices.map(inv => ({
            id: inv.invoiceId,
            date: inv.billingDate,
            amount: `$${inv.amount.toFixed(2)}`,
            status: inv.status
        }))
    }, "Billing status fetched successfully"));
});

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/v1/billing/razorpay/create-order
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { planName, billingCycle } = req.body;
    
    if (!planName) {
        console.error("[Razorpay Error] Missing planName in request body:", req.body);
        throw new ApiError(400, "Plan name is required");
    }

    const org = await Organization.findById(req.user.organizationId);
    if (!org) throw new ApiError(404, "Organization not found");

    let normalizedPlan = String(planName).toLowerCase();
    if (normalizedPlan === 'professional') normalizedPlan = 'pro';
    
    console.log(`[Billing Debug] Original: ${planName}, Normalized: ${normalizedPlan}`);

    const planLimits = BillingService.PLAN_LIMITS[normalizedPlan];
    if (!planLimits) {
        console.error(`[Billing Error] Plan limits not found for normalized key: "${normalizedPlan}". Available:`, Object.keys(BillingService.PLAN_LIMITS));
        throw new ApiError(400, "Invalid plan");
    }

    // Pricing Config (Mock values in INR)
    const isYearly = billingCycle === 'yearly';
    const baseMonthlyPrices = { pro: 2900, enterprise: 9900 };
    
    // Yearly calculation: (Base Monthly * 12 months) * 0.8 (20% discount)
    const amount = isYearly 
        ? baseMonthlyPrices[normalizedPlan] * 12 * 0.8 
        : baseMonthlyPrices[normalizedPlan];

    if (!amount) throw new ApiError(400, "Pricing for this plan is not configured");

    // Prevent duplicate purchase or downgrade
    const currentPlan = org.billing?.plan || 'free';
    const planPriority = { free: 0, pro: 1, enterprise: 2 };

    if (planPriority[normalizedPlan] <= planPriority[currentPlan] && !isYearly) {
        // If switching from monthly to yearly on same plan, we allow it.
        // Otherwise, block same-plan or lower-plan purchases.
        if (org.billing?.billingCycle !== 'yearly' && isYearly && org.billing?.plan === normalizedPlan) {
            // Allow upgrade from monthly to yearly
        } else {
            throw new ApiError(400, `You are already on the ${currentPlan} plan or a higher tier.`);
        }
    }

    try {
        // Razorpay receipt length limit is 40 chars. org._id is 24, timestamp is 13.
        const receiptId = `rcpt_${org._id.toString().slice(-10)}_${Date.now()}`;
        const order = await RazorpayService.createOrder(amount, "INR", receiptId);

        return res.status(200).json(new ApiResponse(200, {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            orgName: org.name,
            userEmail: req.user.email,
            userName: req.user.name
        }, "Razorpay order created"));
    } catch (error) {
        logger.error(`[Razorpay Order Error] ${error.message}`);
        throw new ApiError(500, `Razorpay Initialization Failed: ${error.message}. Please check your RAZORPAY_KEY_ID in .env`);
    }
});

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/v1/billing/razorpay/verify
 */
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } = req.body;

    const isValid = RazorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) throw new ApiError(400, "Invalid payment signature");

    let normalizedPlan = planName.toLowerCase();
    if (normalizedPlan === 'professional') normalizedPlan = 'pro';

    // Upgrade plan
    await BillingService.upgradeOrganizationPlan(req.user.organizationId, normalizedPlan, "razorpay", {
        paymentId: razorpay_payment_id
    });

    // Trigger invoicing
    await BillingService.processSuccessfulPayment(req.user.organizationId, {
        planName: normalizedPlan,
        amount: normalizedPlan === 'pro' ? 2900 * 100 : 9900 * 100, // In cents for uniformity
        invoiceId: razorpay_payment_id
    });

    return res.status(200).json(new ApiResponse(200, {}, "Payment verified and plan upgraded"));
});

/**
 * @desc    Download Invoice PDF
 * @route   GET /api/v1/billing/invoice/:invoiceId/download
 */
const downloadInvoice = asyncHandler(async (req, res) => {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findOne({ 
        invoiceId, 
        organizationId: req.user.organizationId 
    });

    if (!invoice) throw new ApiError(404, "Invoice not found");

    const org = await Organization.findById(req.user.organizationId);
    
    // Generate PDF to a temporary path
    const tempDir = path.join(process.cwd(), "temp", "invoices");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const pdfPath = path.join(tempDir, `${invoiceId}_dl.pdf`);

    await generateInvoicePDF({
        invoiceId: invoice.invoiceId,
        orgName: org.name,
        planName: invoice.planName,
        amount: invoice.amount * 100, // amount in cents/smallest unit for the generator
        date: invoice.billingDate,
        status: invoice.status
    }, pdfPath);

    // Send file and then cleanup
    res.download(pdfPath, `${invoiceId}.pdf`, (err) => {
        if (err) {
            logger.error(`[Invoice Download Error] ${err.message}`);
        }
        // Delete temp file after sending
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    });
});

export {
    createStripeSession,
    handleStripeWebhook,
    getBillingStatus,
    createRazorpayOrder,
    verifyRazorpayPayment,
    downloadInvoice,
    cancelSubscription,
    updateBillingDetails
};

/**
 * Cancel subscription
 */
const cancelSubscription = asyncHandler(async (req, res) => {
    const { Organization } = await import("../models/organization.model.js");
    const org = await Organization.findById(req.user.organizationId);

    if (!org) throw new ApiError(404, "Organization not found");
    if (org.billing?.plan === 'free') throw new ApiError(400, "No active subscription to cancel");

    // 1. If Stripe, cancel in Stripe
    if (org.billing?.stripeCustomerId) {
        await StripeService.cancelSubscription(org.billing.stripeCustomerId);
    }

    // 2. Update local status
    // Note: We don't immediately move to 'free' because they paid for the month.
    // We just set a status or a flag. For now, we'll mark it as 'cancelling'.
    org.billing.status = 'cancelling';
    await org.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Subscription will be cancelled at the end of the billing period")
    );
});

/**
 * Update professional billing details
 */
const updateBillingDetails = asyncHandler(async (req, res) => {
    const { taxId, companyName, address } = req.body;
    const { Organization } = await import("../models/organization.model.js");

    const org = await Organization.findByIdAndUpdate(
        req.user.organizationId,
        {
            $set: {
                "billing.taxId": taxId,
                "billing.companyName": companyName,
                "billing.address": address
            }
        },
        { new: true }
    );

    if (!org) throw new ApiError(404, "Organization not found");

    return res.status(200).json(
        new ApiResponse(200, org.billing, "Billing details updated successfully")
    );
});
