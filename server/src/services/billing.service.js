import { Organization } from "../models/organization.model.js";
import { AuditLog } from "../models/auditLog.model.js";

/**
 * Centralized Service for all Billing & Quota Management
 * This follows the "Single Responsibility Principle" for scalability.
 */
export class BillingService {
    /**
     * DEFINITIVE PLAN LIMITS
     * Update these values in one place to change them across the entire app.
     */
    static PLAN_LIMITS = {
        free: {
            posts: 50,
            accounts: 3,
            storage: 1024 * 1024 * 500, // 500MB
            team: 1
        },
        pro: {
            posts: 500,
            accounts: 15,
            storage: 1024 * 1024 * 1024 * 5, // 5GB
            team: 5
        },
        enterprise: {
            posts: 5000,
            accounts: 50,
            storage: 1024 * 1024 * 1024 * 100, // 100GB
            team: 20
        }
    };

    /**
     * Synchronize and Upgrade an Organization's Plan
     * @param {string} organizationId - The ID of the organization
     * @param {string} planName - 'pro' | 'enterprise' | 'free'
     * @param {string} gateway - 'stripe' | 'razorpay' | 'manual'
     * @param {Object} paymentData - Information from the payment gateway
     */
    static async upgradeOrganizationPlan(organizationId, planName, gateway, paymentData = {}) {
        const limits = this.PLAN_LIMITS[planName.toLowerCase()] || this.PLAN_LIMITS.free;

        // 1. Check for Idempotency (Prevents double-crediting)
        const org = await Organization.findById(organizationId);
        if (!org) throw new Error("Organization not found");

        const transactionId = paymentData.paymentId || paymentData.subscriptionId;
        
        // If this transaction was already processed, skip
        if (org.billing?.lastTransactionId === transactionId) {
            console.log(`[BillingService] Skipping already processed transaction: ${transactionId}`);
            return org;
        }

        // 2. Prepare Update Data
        const updateData = {
            "quota.maxPostsPerMonth": limits.posts,
            "quota.maxSocialAccounts": limits.accounts,
            "quota.maxStorageBytes": limits.storage,
            "quota.maxTeamMembers": limits.team,
            "billing.plan": planName.toLowerCase(),
            "billing.subscriptionStatus": "active",
            "billing.currentPeriodEnd": paymentData.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            "billing.gateway": gateway,
            "billing.lastTransactionId": transactionId
        };

        // 3. Update Organization
        const updatedOrg = await Organization.findByIdAndUpdate(
            organizationId,
            { $set: updateData },
            { new: true }
        );

        // 4. Log the success in AuditLog (Debuggable)
        await AuditLog.create({
            organizationId,
            action: "PLAN_UPGRADE",
            entityType: "Billing",
            details: {
                previousPlan: org.billing?.plan,
                newPlan: planName,
                gateway,
                transactionId
            },
            severity: "info"
        });

        console.log(`[BillingService] Successfully upgraded Org ${organizationId} to ${planName} via ${gateway}`);
        return updatedOrg;
    }
}
