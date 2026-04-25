import { Organization } from "../models/organization.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { AuditLog } from "../models/auditLog.model.js";
import { ScheduledPost } from "../models/scheduledPost.model.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { Media } from "../models/media.model.js";
import mongoose from "mongoose";

import { MailService } from "./mail.service.js";
import crypto from "crypto";

export class SuperadminService {
    /**
     * Provision a new client organization and its first admin
     */
    static async provisionOrganization(data, superadminId) {
        const { companyName, adminName, adminEmail } = data;

        // 1. Validation
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) throw new ApiError(409, "A user with this email already exists");

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 2. Create Organization
            const organization = await Organization.create([{
                name: companyName,
                slug: companyName.toLowerCase().replace(/ /g, "-") + "-" + crypto.randomBytes(2).toString("hex"),
                status: "active",
                quota: {
                    maxAccounts: 5,
                    maxPostsPerMonth: 100,
                    storageLimitGB: 2
                }
            }], { session });

            // 3. Generate Temporary Password
            const tempPassword = crypto.randomBytes(6).toString("hex");

            // 4. Create Admin User
            const user = await User.create([{
                name: adminName,
                email: adminEmail,
                password: tempPassword,
                organizationId: organization[0]._id,
                role: "admin"
            }], { session });

            // 5. Log Security Event
            await AuditLog.create([{
                userId: superadminId,
                organizationId: organization[0]._id, // New org is the context
                action: "system.provisioning",
                entityId: organization[0]._id,
                entityType: "Organization",
                metadata: {
                    companyName,
                    adminEmail,
                    timestamp: new Date()
                }
            }], { session });

            await session.commitTransaction();

            // 6. Send Invitation Email (Out-of-band/Async)
            MailService.sendWelcomeEmail(adminEmail, {
                adminName,
                companyName,
                tempPassword,
                loginUrl: process.env.FRONTEND_URL || "http://localhost:5173"
            }).catch(err => console.error("Failed to send welcome email:", err));

            return {
                organization: organization[0],
                user: user[0]
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get all organizations with basic stats
     */
    static async getAllOrganizations() {
        // Fetch orgs and count their assets for simple oversight
        const organizations = await Organization.find().lean();
        
        const enhancedOrgs = await Promise.all(organizations.map(async (org) => {
            const adminCount = await User.countDocuments({ organizationId: org._id, role: "admin" });
            const accountCount = await SocialAccount.countDocuments({ organizationId: org._id });
            
            // Calculate storage usage
            const mediaStats = await Media.aggregate([
                { $match: { organizationId: org._id } },
                { $group: { _id: null, totalSize: { $sum: "$size" } } }
            ]);
            const storageUsed = mediaStats[0]?.totalSize || 0;

            return {
                ...org,
                stats: {
                    admins: adminCount,
                    totalAccounts: accountCount,
                    storageUsed: storageUsed
                }
            };
        }));

        return enhancedOrgs;
    }

    /**
     * Toggle organization status (active/suspended)
     */
    static async updateOrganizationStatus(orgId, status) {
        if (!["active", "suspended", "maintenance"].includes(status)) {
            throw new ApiError(400, "Invalid status");
        }

        const org = await Organization.findByIdAndUpdate(
            orgId,
            { status, active: status === "active" },
            { new: true }
        );

        if (!org) throw new ApiError(404, "Organization not found");

        // 🚀 Production Enhancement: Notify all Org Admins about the status change
        const admins = await User.find({ organizationId: orgId, role: "admin" });
        
        admins.map(admin => {
            MailService.sendStatusChangeEmail(admin.email, {
                companyName: org.name,
                adminName: admin.name,
                status: status
            }).catch(err => console.error("Notification failed for", admin.email, err));
        });

        return org;
    }

    /**
     * Update organization authority (quotas)
     */
    static async updateOrganizationQuota(orgId, quota) {
        const org = await Organization.findByIdAndUpdate(
            orgId,
            { $set: { quota } },
            { new: true, runValidators: true }
        );

        if (!org) throw new ApiError(404, "Organization not found");

        // 🚀 CRITICAL: Synchronize with Usage model so limits reflect in real-time
        // This ensures the dashboard and post-validation use the new limits immediately
        // Use fallbacks to existing org values to prevent NaN if payload is partial
        const postsLimit = quota.maxPostsPerMonth !== undefined ? quota.maxPostsPerMonth : org.quota.maxPostsPerMonth;
        const platformsLimit = quota.maxAccounts !== undefined ? quota.maxAccounts : org.quota.maxAccounts;
        const storageLimitGB = quota.storageLimitGB !== undefined ? quota.storageLimitGB : (org.quota?.storageLimitGB || 1);

        await mongoose.model("Usage").findOneAndUpdate(
            { organizationId: orgId },
            { 
                $set: { 
                    postsLimit: postsLimit,
                    platformsLimit: platformsLimit,
                    storageLimitBytes: storageLimitGB * 1024 * 1024 * 1024 
                } 
            },
            { upsert: true } // Create usage record if it doesn't exist yet
        );

        return org;
    }

    /**
     * Impersonalization: Generate a support access token
     * This logic is purely business - the controller generates the JWT
     */
    static async prepareImpersonation(targetUserId, superadminId) {
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) throw new ApiError(404, "User not found");

        // Log the impersonation event for security forensics
        await AuditLog.create({
            userId: superadminId,
            action: "system.impersonation",
            entityId: targetUserId,
            entityType: "User",
            metadata: {
                targetEmail: targetUser.email,
                reason: "Support requested",
                timestamp: new Date()
            }
        });

        return targetUser;
    }

    /**
     * Global Failure Feed (Scalable monitoring)
     */
    static async getGlobalFailureFeed(page = 1, limit = 20) {
        const query = { action: { $in: ["post.failed", "social.account.expired"] } };
        
        const logs = await AuditLog.find(query)
            .populate("userId", "name email")
            .populate("organizationId", "name")
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await AuditLog.countDocuments(query);

        return {
            logs,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Platform-wide Growth & Usage Metrics (Production level)
     */
    static async getGlobalGrowthMetrics() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // 1. Core KPIs
        const totalOrgs = await Organization.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalPosts = await ScheduledPost.countDocuments();
        const activeSocialAccounts = await SocialAccount.countDocuments({ status: "active" });

        // 2. Organization Growth (Last 6 months)
        const orgGrowth = await Organization.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { 
                        year: { $year: "$createdAt" }, 
                        month: { $month: "$createdAt" } 
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // 3. User Growth (Last 6 months)
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { 
                        year: { $year: "$createdAt" }, 
                        month: { $month: "$createdAt" } 
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // 4. Post Volume Trend
        const postVolume = await ScheduledPost.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { 
                        year: { $year: "$createdAt" }, 
                        month: { $month: "$createdAt" } 
                    },
                    total: { $sum: 1 },
                    published: { 
                        $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } 
                    },
                    failed: { 
                        $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } 
                    }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        return {
            kpis: {
                totalOrganizations: totalOrgs,
                totalUsers: totalUsers,
                totalPosts: totalPosts,
                activeSocialAccounts: activeSocialAccounts
            },
            growth: {
                organizations: orgGrowth,
                users: userGrowth,
                posts: postVolume
            }
        };
    }
}
