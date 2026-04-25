import mongoose from "mongoose";
import { ScheduledPost } from "../models/scheduledPost.model.js";

/**
 * Production-ready status categorization
 * Centralized mapping to prevent data drift between stats and list views
 */
export const STATUS_CATEGORIES = {
    SCHEDULED: ["scheduled", "pending", "pending_approval", "approved", "processing"],
    PUBLISHED: ["posted", "published"],
    FAILED: ["failed", "rejected", "cancelled"]
};

/**
 * Service for handling post-related business logic
 */
export const getFilteredPosts = async ({
    organizationId,
    socialAccountId,
    groupId,
    platform,
    search,
    status,
    postType,
    startDate,
    endDate,
    page = 1,
    limit = 20
}) => {
    // 1. Build Query Object
    const query = { organizationId: new mongoose.Types.ObjectId(organizationId) };

    if (groupId && groupId !== "all") {
        const { AccountGroup } = await import("../models/accountGroup.model.js");
        const group = await AccountGroup.findOne({ 
            _id: new mongoose.Types.ObjectId(groupId), 
            organizationId: query.organizationId 
        });
        
        if (group && group.accounts && group.accounts.length > 0) {
            query.socialAccountId = { $in: group.accounts };
        } else {
            // Force no results if group is empty or not found
            query.socialAccountId = new mongoose.Types.ObjectId();
        }
    }

    if (socialAccountId) {
        query.socialAccountId = new mongoose.Types.ObjectId(socialAccountId);
    }

    if (platform && platform !== "all") {
        query.platform = platform;
    }

    if (postType && postType !== "all") {
        query.postType = postType;
    }

    if (search) {
        query.caption = { $regex: search, $options: "i" };
    }

    // Apply centralized status categorization
    if (status) {
        if (status === "posted" || status === "published") {
            query.status = { $in: STATUS_CATEGORIES.PUBLISHED };
        } else if (status === "scheduled") {
            query.status = { $in: STATUS_CATEGORIES.SCHEDULED };
        } else if (status === "failed") {
            query.status = { $in: STATUS_CATEGORIES.FAILED };
        } else {
            query.status = status;
        }
    }

    // Date Range Filtering
    const hasDateFilters = startDate || endDate;
    if (hasDateFilters) {
        query.scheduledAt = {};
        if (startDate) {
            query.scheduledAt.$gte = new Date(startDate);
        }
        if (endDate) {
            // Logic: For failed/published, we usually want a hard range check
            // For scheduled, we might want to see future posts even if above range
            const isLookingForPastOnly = status && [...STATUS_CATEGORIES.PUBLISHED, ...STATUS_CATEGORIES.FAILED].includes(status);
            if (!isLookingForPastOnly && !socialAccountId) {
                query.scheduledAt.$lte = new Date(endDate);
            } else if (isLookingForPastOnly) {
                 query.scheduledAt.$lte = new Date(endDate);
            }
        }
    }

    // 2. Execute Query
    const posts = await ScheduledPost.find(query)
        .populate("mediaId")
        .populate("mediaIds")
        .populate("socialAccountId", "platform platformUserName channelTitle avatar thumbnail picture followerCount follower_count metadata statistics")
        .sort({ scheduledAt: (status === "scheduled" || !status) ? 1 : -1 }) 
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await ScheduledPost.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // 3. Fallback for orphaned posts (where account was disconnected and re-connected)
    // We want to show the current active account for that platform if the original is gone
    const processedPosts = await Promise.all(posts.map(async (post) => {
        const postObj = post.toObject();
        
        if (!postObj.socialAccountId) {
            const { SocialAccount } = await import("../models/socialAccount.model.js");
            // Strategy: Find any active account for this platform. 
            // If we have platformUserId stored in the post, match by that for perfect accuracy.
            const fallbackQuery = {
                organizationId: query.organizationId,
                platform: post.platform
            };
            if (post.platformUserId) {
                fallbackQuery.platformUserId = post.platformUserId;
            }

            const activeAccount = await SocialAccount.findOne(fallbackQuery)
                .select("platform platformUserName channelTitle avatar thumbnail picture followerCount metadata statistics");
            
            if (activeAccount) {
                postObj.socialAccountId = activeAccount;
            }
        }
        return postObj;
    }));

    return {
        posts: processedPosts,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
    };
};

/**
 * Get basic status stats for a specific account or organization
 * Uses the exact same categorization as getFilteredPosts
 */
export const getPostStatsSummary = async (organizationId, socialAccountId = null) => {
    const match = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (socialAccountId) {
        match.socialAccountId = new mongoose.Types.ObjectId(socialAccountId);
    }

    const stats = await ScheduledPost.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    // Map into categorized summary
    const summary = {
        total: 0,
        scheduled: 0,
        published: 0,
        failed: 0,
        pending_approval: 0
    };

    stats.forEach(s => {
        const statusCode = s._id?.toLowerCase();
        
        if (STATUS_CATEGORIES.SCHEDULED.includes(statusCode)) {
            summary.scheduled += s.count;
        }
        if (STATUS_CATEGORIES.PUBLISHED.includes(statusCode)) {
            summary.published += s.count;
        }
        if (STATUS_CATEGORIES.FAILED.includes(statusCode)) {
            summary.failed += s.count;
        }
        
        // Track specifically for the 'Needs Review' type badges if needed
        if (statusCode === "pending_approval") {
            summary.pending_approval += s.count;
        }
        
        summary.total += s.count;
    });

    return summary;
};

