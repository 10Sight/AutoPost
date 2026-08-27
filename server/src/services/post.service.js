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

export const PLATFORMS = ["instagram", "facebook", "linkedin", "x", "youtube"];

/**
 * Builds a per-day activity series (last `days` days, inclusive of today) broken down
 * by platform. Shared by the dashboard overview chart and the analytics volume chart
 * so the "fill missing days with zeros" logic only lives in one place.
 */
export const buildDailySeries = async (matchQueryBase, days, { totalKey = "total" } = {}) => {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() - (days - 1));

    const dailyActivity = await ScheduledPost.aggregate([
        {
            $match: {
                ...matchQueryBase,
                scheduledAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$scheduledAt" } },
                    platform: "$platform"
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { "_id.date": 1 } },
    ]);

    const series = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split("T")[0];

        const dayStats = {
            date: dateString,
            day: d.getDate(),
            name: days <= 7
                ? d.toLocaleDateString("en-US", { weekday: "short" })
                : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            [totalKey]: 0,
        };

        PLATFORMS.forEach(platform => {
            const found = dailyActivity.find(item => item._id.date === dateString && item._id.platform === platform);
            const count = found ? found.count : 0;
            dayStats[platform] = count;
            dayStats[totalKey] += count;
        });

        series.push(dayStats);
    }

    return series;
};

/**
 * Sums post counts per platform within [startDate, endDate). Used to compute
 * period-over-period growth (e.g. this window vs. the equally-sized window before it).
 */
export const getPlatformTotals = async (matchQueryBase, startDate, endDate) => {
    const results = await ScheduledPost.aggregate([
        {
            $match: {
                ...matchQueryBase,
                scheduledAt: { $gte: startDate, $lt: endDate },
            },
        },
        { $group: { _id: "$platform", count: { $sum: 1 } } },
    ]);

    const totals = {};
    PLATFORMS.forEach(p => { totals[p] = 0; });
    results.forEach(r => {
        if (totals[r._id] !== undefined) totals[r._id] = r.count;
    });
    return totals;
};

/**
 * Percentage change from previous -> current. Treats "0 -> N" as +100% growth
 * (rather than Infinity) and "0 -> 0" as flat.
 */
export const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
};

/**
 * Service for handling post-related business logic
 */
// Fields callers are allowed to sort by; anything else falls back to the default order.
const SORTABLE_FIELDS = new Set(["scheduledAt", "updatedAt", "createdAt"]);

// Parses a "-field" / "field" sort string (e.g. "-updatedAt") into a Mongoose sort
// object, defaulting to the historical scheduledAt ordering when omitted/invalid.
const resolveSort = (sort, status) => {
    if (sort) {
        const direction = sort.startsWith("-") ? -1 : 1;
        const field = sort.replace(/^-/, "");
        if (SORTABLE_FIELDS.has(field)) return { [field]: direction };
    }
    return { scheduledAt: (status === "scheduled" || !status) ? 1 : -1 };
};

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
    limit = 20,
    sort
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
        .sort(resolveSort(sort, status))
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

