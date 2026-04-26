import { Organization } from "../models/organization.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import { MailService } from "./mail.service.js";
import { User } from "../models/user.model.js";
import { Invoice } from "../models/invoice.model.js";
import fs from "fs";
import path from "path";

/**
 * Centralized Service for all Billing & Quota Management
 */
export class BillingService {
    /**
     * Handle the side-effects of a successful payment (Invoicing, Email)
     */
    static async processSuccessfulPayment(organizationId, paymentData) {
        try {
            const org = await Organization.findById(organizationId);
            const admin = await User.findOne({ organizationId, role: "admin" });

            if (!org || !admin) return;

            // 1. Generate PDF Invoice
            const invoiceId = `INV-${Date.now()}`;
            const tempDir = path.join(process.cwd(), "temp", "invoices");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const pdfPath = path.join(tempDir, `${invoiceId}.pdf`);
            
            await generateInvoicePDF({
                invoiceId,
                orgName: org.name,
                planName: paymentData.planName,
                amount: paymentData.amount,
                date: new Date(),
                status: "paid"
            }, pdfPath);
            
            // 2. Create Invoice Record in DB
            await Invoice.create({
                organizationId,
                invoiceId,
                planName: paymentData.planName,
                amount: paymentData.amount / 100, // Assuming amount is in cents from Stripe
                billingDate: new Date(),
                status: "paid"
            });

            // 3. Send Email with Attachment
            await MailService.sendInvoiceEmail(admin.email, {
                adminName: admin.name,
                planName: paymentData.planName,
                amount: paymentData.amount,
                invoiceId
            }, pdfPath);

            // 3. Cleanup temp file after a short delay (to ensure email is sent)
            setTimeout(() => {
                if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            }, 60000); // 1 minute

            console.log(`[BillingService] Automated invoice sent for Org: ${organizationId}`);
        } catch (error) {
            console.error(`[BillingService] Failed to process payment side-effects:`, error);
        }
    }
    /**
     * DEFINITIVE PLAN LIMITS
     * Update these values in one place to change them across the entire app.
     */
    /**
     * DEFINITIVE PLAN LIMITS
     * These are the source of truth for all resource enforcement.
     */
    static PLAN_LIMITS = {
        free: {
            name: "Free",
            posts: 10,
            accounts: 3,
            storage: 1024 * 1024 * 500, // 500MB
            team: 1,
            youtubeQuota: 5000,
            features: ["Manual Posting", "Basic Editor", "Single Channel per Platform"]
        },
        pro: {
            name: "Professional",
            posts: 100,
            accounts: 10,
            storage: 1024 * 1024 * 1024 * 10, // 10GB
            team: 5,
            youtubeQuota: 20000,
            features: ["Auto Scheduling", "Advanced Video Editor", "AI Caption Studio (Upcoming)", "Analytics Dashboard"]
        },
        enterprise: {
            name: "Enterprise",
            posts: 5000,
            accounts: 50,
            storage: 1024 * 1024 * 1024 * 100, // 100GB
            team: 20,
            youtubeQuota: 100000,
            features: ["Unlimited Scheduling", "Bulk Uploads", "Priority Support", "Custom Branding", "Team Approval Workflows"]
        }
    };

    /**
     * Synchronize an organization's internal usage limits with their current billing plan.
     * This is called after payments, plan changes, or during self-healing.
     */
    static async syncOrganizationQuotas(organizationId) {
        const org = await Organization.findById(organizationId);
        if (!org) return;

        const planName = org.billing?.plan || "free";
        const limits = this.PLAN_LIMITS[planName] || this.PLAN_LIMITS.free;

        // 1. Update Organization Master Record
        await Organization.findByIdAndUpdate(organizationId, {
            $set: {
                "quota.maxAccounts": limits.accounts,
                "quota.maxPostsPerMonth": limits.posts,
                "quota.storageLimitGB": Math.round(limits.storage / (1024 * 1024 * 1024))
            }
        });

        // 2. Update Real-time Usage Cache (Usage Model)
        const { Usage } = await import("../models/usage.model.js");
        await Usage.findOneAndUpdate(
            { organizationId },
            {
                $set: {
                    postsLimit: limits.posts,
                    platformsLimit: limits.accounts,
                    storageLimitBytes: limits.storage,
                    teamLimit: limits.team,
                    youtubeQuotaLimit: limits.youtubeQuota
                }
            },
            { upsert: true }
        );

        console.log(`[BillingService] Synced quotas for Org ${organizationId} to plan: ${planName}`);
    }

    /**
     * Synchronize and Upgrade an Organization's Plan via Payment Gateway
     */
    static async upgradeOrganizationPlan(organizationId, planName, gateway, paymentData = {}) {
        const limits = this.PLAN_LIMITS[planName.toLowerCase()] || this.PLAN_LIMITS.free;

        // 1. Check for Idempotency
        const org = await Organization.findById(organizationId);
        if (!org) throw new Error("Organization not found");

        const transactionId = paymentData.paymentId || paymentData.subscriptionId;
        
        if (org.billing?.lastTransactionId === transactionId && transactionId) {
            console.log(`[BillingService] Skipping already processed transaction: ${transactionId}`);
            return org;
        }

        // 2. Prepare Update Data
        const isYearly = (paymentData.billingCycle || org.billing?.billingCycle) === 'yearly';
        const cycleDuration = isYearly ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

        const updateData = {
            "billing.plan": planName.toLowerCase(),
            "billing.billingCycle": isYearly ? "yearly" : "monthly",
            "billing.subscriptionStatus": "active",
            "billing.currentPeriodEnd": paymentData.currentPeriodEnd || new Date(Date.now() + cycleDuration),
            "billing.gateway": gateway,
            "billing.lastTransactionId": transactionId,
            "billing.stripeSubscriptionId": paymentData.subscriptionId || org.billing?.stripeSubscriptionId
        };

        // 3. Update Organization
        const updatedOrg = await Organization.findByIdAndUpdate(
            organizationId,
            { $set: updateData },
            { new: true }
        );

        // 4. Force quota sync immediately
        await this.syncOrganizationQuotas(organizationId);

        // 5. Log the success
        await AuditLog.create({
            organizationId,
            action: "PLAN_UPGRADE",
            entityType: "Billing",
            entityId: organizationId,
            details: {
                previousPlan: org.billing?.plan,
                newPlan: planName,
                gateway,
                transactionId
            },
            severity: "info"
        });

        return updatedOrg;
    }
}
