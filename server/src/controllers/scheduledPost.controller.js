import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ScheduledPost } from "../models/scheduledPost.model.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { eventBus } from "../utils/eventBus.js";
import { EVENTS } from "../events/events.js";
import { getSmartSuggestions as getSuggestionsService } from "../services/smartSchedule.service.js";
import fs from "fs";
import { validateCsv } from "../services/csv.service.js";
import { PostVersion } from "../models/postVersion.model.js";
import { MEDIA_RULES } from "../utils/mediaRules.js";
import { validateLimit, updateUsage } from "../services/usage.service.js";
import { Media } from "../models/media.model.js";
import { evaluateRules } from "../services/ruleEngine.service.js";
import { getFilteredPosts, getPostStatsSummary } from "../services/post.service.js";
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { AccountGroup } from "../models/accountGroup.model.js";

const validateMediaCompatibility = (media, platform) => {
    const rules = MEDIA_RULES[platform.toLowerCase()];
    const results = { errors: [], warnings: [] };
    if (!rules) return results;

    const isVideo = media.type === "video";
    const typeRules = isVideo ? rules.video : rules.image;

    // 1. Technical Errors (Blocking)
    // Duration check for videos
    if (isVideo && media.duration && typeRules.maxDuration) {
        if (media.duration > typeRules.maxDuration) {
            results.errors.push(`Video duration (${media.duration.toFixed(1)}s) exceeds ${platform} limit of ${typeRules.maxDuration}s`);
        }
    }

    // Size check
    if (media.size && typeRules.maxSize) {
        if (media.size > typeRules.maxSize) {
            results.errors.push(`Media size (${(media.size / (1024 * 1024)).toFixed(1)}MB) exceeds ${platform} limit`);
        }
    }

    // 2. Intelligence Warnings (Non-blocking)
    if (platform.toLowerCase() === "youtube" && isVideo) {
        const intel = typeRules.intelligence;
        if (intel) {
            // Aspect Ratio Check
            if (media.aspectRatio && media.aspectRatio !== intel.preferredRatio) {
                // Check for Shorts (9:16)
                if (media.aspectRatio !== "9:16") {
                    results.warnings.push(`Non-ideal aspect ratio (${media.aspectRatio}) for YouTube. 16:9 preferred.`);
                }
            }

            // Resolution check
            if (media.height && media.height < 720) {
                results.warnings.push(`Low resolution (${media.width}x${media.height}). YouTube recommends at least 720p HD.`);
            }

            // Audio presence (Check cloudinary metadata if available)
            if (media.metadata && media.metadata.is_audio === false) {
                results.warnings.push("Video has no audio track.");
            }
        }
    }

    return results;
};

const createVersion = async (post, userId, changeLog = "") => {
    const lastVersion = await PostVersion.findOne({ postId: post._id })
        .sort({ versionNumber: -1 });

    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    return await PostVersion.create({
        postId: post._id,
        versionNumber,
        caption: post.caption,
        mediaId: post.mediaId,
        mediaIds: post.mediaIds,
        scheduledAt: post.scheduledAt,
        platform: post.platform,
        createdBy: userId,
        changeLog,
    });
};

const createScheduledPost = asyncHandler(async (req, res) => {
    const { socialAccountId, platform, postType, mediaId, mediaIds: inputMediaIds, caption, scheduledAt, thumbnailMediaId } =
        req.body;

    if (!socialAccountId || !platform || !scheduledAt) {
        throw new ApiError(
            400,
            "Social Account, Platform, and Scheduled Time are required"
        );
    }

    const account = await SocialAccount.findOne({
        _id: socialAccountId,
        organizationId: req.user.organizationId,
        platform,
    });

    if (!account) {
        throw new ApiError(
            404,
            "Social account not found in your organization"
        );
    }

    // Usage Tracking: Validate post limit
    await validateLimit(req.user.organizationId, 'posts');

    // Validate scheduledAt is in the future
    if (new Date(scheduledAt) <= new Date()) {
        throw new ApiError(400, "Scheduled time must be in the future");
    }

    let finalMediaIds = inputMediaIds || (mediaId ? [mediaId] : []);
    let thumbnailUrl = null;
    if (thumbnailMediaId) {
        const thumbMedia = await Media.findById(thumbnailMediaId);
        if (thumbMedia) {
            thumbnailUrl = thumbMedia.url;
        }
    }

    // Check global limitation: All Images OR All Videos
    let mediaItems = [];
    let mediaIntelligenceWarnings = [];

    if (finalMediaIds.length > 0) {
        mediaItems = await Media.find({ _id: { $in: finalMediaIds } });
        if (mediaItems.length !== finalMediaIds.length) {
            throw new ApiError(404, "One or more Media items not found");
        }

        // Platform-specific validations
        if (platform.toLowerCase() === "youtube" && mediaItems.length > 1) {
            throw new ApiError(400, "YouTube requires exactly one video media item.");
        }

        // Enforce homogeneous carousel
        const hasVideo = mediaItems.some(m => m.type === "video");
        const hasImage = mediaItems.some(m => m.type === "image");
        if (hasVideo && hasImage) {
            throw new ApiError(400, "Mixed media (combining images and videos) is not supported. Please select only images or only videos.");
        }
        if (platform.toLowerCase() === "youtube" && !hasVideo) {
            throw new ApiError(400, "YouTube requires a video for posting.");
        }

        // Validate each item individually
        for (const media of mediaItems) {
            const compatibility = validateMediaCompatibility(media, platform);
            if (compatibility.errors.length > 0) {
                throw new ApiError(400, compatibility.errors[0], compatibility.errors);
            }
            mediaIntelligenceWarnings.push(...compatibility.warnings);
        }
    }

    // Evaluate Rules
    const ruleResults = await evaluateRules(
        req.user.organizationId,
        "BEFORE_SCHEDULE",
        { caption, platform, scheduledAt, media: mediaItems[0] } // Legacy rule testing with primary map
    );

    if (ruleResults.block.length > 0) {
        throw new ApiError(403, ruleResults.block[0].message, ruleResults.block);
    }

    // Determine initial status based on role
    const isCreator = req.user.role === "creator";
    const initialStatus = isCreator ? "pending_approval" : "scheduled";

    const post = await ScheduledPost.create({
        userId: req.user._id,
        organizationId: req.user.organizationId,
        socialAccountId,
        platform,
        postType: postType || "post",
        platformUserId: account.platformUserId,
        mediaId: finalMediaIds[0] || null, // legacy compat
        mediaIds: finalMediaIds,
        caption,
        scheduledAt,
        thumbnailUrl,
        thumbnailMediaId,
        status: initialStatus,
        approvalHistory: isCreator ? [{
            action: "submitted",
            userId: req.user._id,
            comment: "Submitted for approval"
        }] : [],
    });

    // Create v1 version
    await createVersion(post, req.user._id, "Initial post creation");

    // Usage Tracking: Increment post count
    await updateUsage(req.user.organizationId, 'posts', 1, 'inc');

    // Resolve group for auditing context (production level scalability)
    const associatedGroup = await AccountGroup.findOne({ 
        organizationId: req.user.organizationId, 
        accounts: socialAccountId 
    }).select("_id");

    eventBus.emit(EVENTS.POST_CREATED, {
        postId: post._id,
        userId: req.user._id,
        organizationId: req.user.organizationId,
        socialAccountId: post.socialAccountId,
        groupId: associatedGroup?._id,
        platform: post.platform,
        scheduledAt: post.scheduledAt,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
    });

    return res
        .status(201)
        .json(new ApiResponse(201, {
            post,
            warnings: [...ruleResults.warn, ...mediaIntelligenceWarnings.map(msg => ({ field: 'media', message: msg, severity: 'warn' }))]
        }, "Post scheduled successfully"));
});

const updateScheduledPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { caption, mediaId, mediaIds: inputMediaIds, scheduledAt, changeLog } = req.body;

    const post = await ScheduledPost.findOne({ _id: postId, organizationId: req.user.organizationId });
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.status === "published") {
        throw new ApiError(400, "Cannot edit a post that has already been published");
    }

    // Update post fields
    if (caption !== undefined) post.caption = caption;
    if (inputMediaIds !== undefined || mediaId !== undefined) {
        let finalMediaIds = inputMediaIds !== undefined ? inputMediaIds : (mediaId ? [mediaId] : []);
        let mediaItems = [];

        if (finalMediaIds.length > 0) {
            mediaItems = await Media.find({ _id: { $in: finalMediaIds } });
            if (mediaItems.length !== finalMediaIds.length) {
                throw new ApiError(404, "One or more Media items not found");
            }

            if (post.platform.toLowerCase() === "youtube" && mediaItems.length > 1) {
                throw new ApiError(400, "YouTube requires exactly one video media item.");
            }

            const hasVideo = mediaItems.some(m => m.type === "video");
            const hasImage = mediaItems.some(m => m.type === "image");
            if (hasVideo && hasImage) {
                throw new ApiError(400, "Mixed media (combining images and videos) is not supported.");
            }
            if (post.platform.toLowerCase() === "youtube" && !hasVideo) {
                throw new ApiError(400, "YouTube requires a video for posting.");
            }

            const warningsAcc = [];
            for (const media of mediaItems) {
                const compatibility = validateMediaCompatibility(media, post.platform);
                if (compatibility.errors.length > 0) {
                    throw new ApiError(400, compatibility.errors[0], compatibility.errors);
                }
                warningsAcc.push(...compatibility.warnings);
            }
            req.mediaWarnings = warningsAcc;
        }

        post.mediaId = finalMediaIds[0] || null;
        post.mediaIds = finalMediaIds;

        // Re-evaluate rules on update
        const ruleResults = await evaluateRules(
            req.user.organizationId,
            "BEFORE_SCHEDULE",
            {
                caption: caption !== undefined ? caption : post.caption,
                platform: post.platform,
                scheduledAt: scheduledAt !== undefined ? scheduledAt : post.scheduledAt,
                media: post.mediaIds.length > 0 ? { _id: post.mediaIds[0] } : null // legacy bypass compat
            }
        );

        if (ruleResults.block.length > 0) {
            throw new ApiError(403, ruleResults.block[0].message, ruleResults.block);
        }
        req.ruleWarnings = ruleResults.warn; // Pass to response
    }
    if (scheduledAt !== undefined) {
        if (new Date(scheduledAt) <= new Date()) {
            throw new ApiError(400, "Scheduled time must be in the future");
        }
        post.scheduledAt = scheduledAt;
    }

    await post.save();

    // Create new version
    await createVersion(post, req.user._id, changeLog || "Post updated");

    // Resolve group for auditing context
    const associatedGroup = await AccountGroup.findOne({ 
        organizationId: req.user.organizationId, 
        accounts: post.socialAccountId 
    }).select("_id");

    eventBus.emit(EVENTS.POST_UPDATED, {
        postId: post._id,
        userId: req.user._id,
        organizationId: req.user.organizationId,
        socialAccountId: post.socialAccountId,
        groupId: associatedGroup?._id,
        platform: post.platform,
        scheduledAt: post.scheduledAt,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
    });

    const finalWarnings = [
        ...(req.ruleWarnings || []),
        ...((req.mediaWarnings || []).map(msg => ({ field: 'media', message: msg, severity: 'warn' })))
    ];

    return res
        .status(200)
        .json(new ApiResponse(200, { post, warnings: finalWarnings }, "Post updated successfully and new version created"));
});

const getPostVersions = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    // Verify post ownership (by organization)
    const post = await ScheduledPost.findOne({ _id: postId, organizationId: req.user.organizationId });
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const versions = await PostVersion.find({ postId })
        .populate("createdBy", "name email")
        .populate("mediaId")
        .populate("mediaIds")
        .sort({ versionNumber: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, versions, "Post versions fetched successfully"));
});

const rollbackPostVersion = asyncHandler(async (req, res) => {
    const { postId, versionNumber } = req.params;

    const post = await ScheduledPost.findOne({ _id: postId, organizationId: req.user.organizationId });
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.status === "published") {
        throw new ApiError(400, "Cannot rollback a post that has already been published");
    }

    const version = await PostVersion.findOne({ postId, versionNumber: parseInt(versionNumber) });
    if (!version) {
        throw new ApiError(404, "Version not found");
    }

    // Restore content
    post.caption = version.caption;
    post.mediaId = version.mediaId;
    post.mediaIds = version.mediaIds && version.mediaIds.length > 0 ? version.mediaIds : (version.mediaId ? [version.mediaId] : []);
    // We might want to keep the current scheduled time or rollback it too.
    // Given the requirement "Rollback to previous version", we rollback everything.
    post.scheduledAt = version.scheduledAt;

    await post.save();

    // Create a new version representing the rollback action
    await createVersion(post, req.user._id, `Rolled back to version ${versionNumber}`);

    eventBus.emit(EVENTS.POST_UPDATED, {
        postId: post._id,
        userId: req.user._id,
        organizationId: req.user.organizationId,
        platform: post.platform,
        scheduledAt: post.scheduledAt,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, post, `Post rolled back to version ${versionNumber} successfully`));
});

const getScheduledPosts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        postType,
        socialAccountId,
        groupId,
        platform,
        search,
        startDate,
        endDate
    } = req.query;

    // Delegate all business logic and query construction to the service layer
    const result = await getFilteredPosts({
        organizationId: req.user.organizationId,
        socialAccountId,
        groupId,
        platform,
        search,
        status,
        postType,
        startDate,
        endDate,
        page,
        limit
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result,
                "Posts fetched successfully"
            )
        );
});

const getScheduledPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await ScheduledPost.findOne({
        _id: postId,
        organizationId: req.user.organizationId,
    }).populate("mediaId").populate("mediaIds").populate("socialAccountId", "platform platformUserName channelTitle avatar thumbnail picture displayName metadata statistics");

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, post, "Post fetched successfully"));
});

const deleteScheduledPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await ScheduledPost.findOneAndDelete({
        _id: postId,
        organizationId: req.user.organizationId,
    });

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    eventBus.emit(EVENTS.POST_DELETED, {
        postId: postId,
        userId: req.user._id,
        organizationId: req.user.organizationId,
        platform: post.platform
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Scheduled post deleted successfully"));
});

const getDashboardStats = asyncHandler(async (req, res) => {
    const organizationId = req.user.organizationId;
    const { groupId } = req.query;

    const matchId = (id) => (typeof id === "string" && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);
    const matchQuery = { organizationId: matchId(organizationId) };

    // Resolve groupId to account filter if applicable
    if (groupId && groupId !== "all" && mongoose.Types.ObjectId.isValid(groupId)) {
        try {
            const { AccountGroup } = await import("../models/accountGroup.model.js");
            const group = await AccountGroup.findOne({ 
                _id: matchId(groupId), 
                organizationId: matchQuery.organizationId 
            });

            if (group && group.accounts && group.accounts.length > 0) {
                // Ensure we use IDs even if populated, and convert to ObjectIds for the aggregation
                matchQuery.socialAccountId = { 
                    $in: group.accounts.map(acc => matchId(typeof acc === "object" && acc._id ? acc._id : acc)) 
                };
                logger.info(`Filtering dashboard for group: ${group.name} (${group.accounts.length} accounts)`);
            } else if (group) {
                // Group with no accounts returns empty stats immediately for performance
                return res.status(200).json(
                    new ApiResponse(
                        200, 
                        { 
                            stats: { total: 0, pending: 0, posted: 0, failed: 0 }, 
                            chartData: [], 
                            platformDistribution: [] 
                        }, 
                        "Group has no accounts."
                    )
                );
            }
        } catch (err) {
            logger.error(`Error applying group filter to dashboard: ${err.message}`);
        }
    }

    // 1. Get counts by status using the dynamic matchQuery
    const statusCounts = await ScheduledPost.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    // Initialize defaults
    const stats = {
        total: 0,
        pending: 0,
        posted: 0,
        failed: 0,
    };

    statusCounts.forEach((item) => {
        const status = item._id;
        
        // Production-level status mapping: 
        // include all states that represent upcoming or currently being processed content
        if (["scheduled", "pending_approval", "approved", "processing"].includes(status)) {
            stats.pending += item.count;
        }
        
        // Count both successfully sent statuses
        if (status === "posted" || status === "published") {
            stats.posted += item.count;
        }
        
        if (status === "failed") {
            stats.failed += item.count;
        }
        
        stats.total += item.count;
    });

    // 2. Get daily activity for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyActivity = await ScheduledPost.aggregate([
        {
            $match: {
                ...matchQuery,
                scheduledAt: { $gte: sevenDaysAgo },
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

    // Fill in missing days and platforms
    const platforms = ["instagram", "facebook", "linkedin", "x", "youtube"];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split("T")[0];
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

        const dayStats = {
            name: dayName,
            date: dateString,
            total: 0
        };

        // Add counts for each platform
        platforms.forEach(platform => {
            const found = dailyActivity.find(item => item._id.date === dateString && item._id.platform === platform);
            const count = found ? found.count : 0;
            dayStats[platform] = count;
            dayStats.total += count;
        });

        chartData.push(dayStats);
    }

    // 3. Platform Distribution
    const platformDistribution = await ScheduledPost.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: "$platform",
                count: { $sum: 1 },
            },
        },
        { $project: { name: "$_id", value: "$count", _id: 0 } }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                stats,
                chartData,
                platformDistribution
            },
            "Dashboard stats fetched successfully"
        )
    );
});

const getAnalytics = asyncHandler(async (req, res) => {
    const organizationId = req.user.organizationId;
    const { days: daysQuery, groupId } = req.query;
    const days = parseInt(daysQuery) || 30;

    console.log(`[DEBUG] Analytics Request - Org: ${organizationId}, Group: ${groupId}, Days: ${days}`);

    // Build the query match object
    const matchId = (id) => (typeof id === "string" && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);
    const matchQuery = { organizationId: matchId(organizationId) };

    // If groupId is provided, narrow down the accounts we are analyzing
    if (groupId && groupId !== "all" && mongoose.Types.ObjectId.isValid(groupId)) {
        try {
            const { AccountGroup } = await import("../models/accountGroup.model.js");
            const group = await AccountGroup.findOne({ 
                _id: matchId(groupId), 
                organizationId: matchQuery.organizationId 
            });

            if (group && group.accounts && group.accounts.length > 0) {
                // Explicitly cast all accounts to ObjectIds for the aggregation pipeline
                matchQuery.socialAccountId = { $in: group.accounts.map(id => matchId(id)) };
                logger.info(`Analyzing group: ${group.name} (${group.accounts.length} accounts)`);
            } else if (group) {
                return res.status(200).json(
                    new ApiResponse(200, { platformDistribution: [], statusDistribution: [], volumeData: [] }, "Group has no accounts.")
                );
            }
        } catch (err) {
            logger.error(`Error processing analytics group filter: ${err.message}`);
        }
    }

    // 1. Platform Distribution (Pie Chart)
    const platformDistribution = await ScheduledPost.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: "$platform",
                count: { $sum: 1 },
            },
        },
        { $project: { name: "$_id", value: "$count", _id: 0 } } // Format for Recharts
    ]);

    // 2. Status Breakdown (Pie/Donut)
    const statusDistribution = await ScheduledPost.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: {
                    platform: "$platform",
                    status: "$status"
                },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                platform: "$_id.platform",
                status: "$_id.status",
                value: "$count",
                _id: 0
            }
        }
    ]);

    // 3. Weekly Volume Comparison
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const volumeMatch = { 
        ...matchQuery, 
        scheduledAt: { $gte: startDate } 
    };

    const dailyVolume = await ScheduledPost.aggregate([
        { $match: volumeMatch },
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

    // Fill missing days and platforms
    const platforms = ["instagram", "facebook", "linkedin", "x", "youtube"];
    const volumeData = [];

    // Use the start of today as the reference point
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    for (let i = (days - 1); i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - i);

        // MongoDB $dateToString in UTC format: YYYY-MM-DD
        const dateString = d.toISOString().split("T")[0];
        const dayOfMonth = d.getDate();

        const dayStats = {
            date: dateString,
            day: dayOfMonth,
            posts: 0
        };

        // Add counts for each platform
        platforms.forEach(platform => {
            const found = dailyVolume.find(item => item._id.date === dateString && item._id.platform === platform);
            const count = found ? found.count : 0;
            dayStats[platform] = count;
            dayStats.posts += count;
        });

        volumeData.push(dayStats);
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                platformDistribution,
                statusDistribution,
                volumeData
            },
            "Analytics data fetched successfully"
        )
    );
});


const getSmartSuggestions = asyncHandler(async (req, res) => {
    const { platform } = req.query;
    const organizationId = req.user.organizationId;

    const suggestions = await getSuggestionsService(organizationId, platform);

    return res
        .status(200)
        .json(
            new ApiResponse(200, suggestions, "Smart suggestions fetched successfully")
        );
});


const bulkCreateScheduledPosts = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Please upload a CSV file");
    }

    const filePath = req.file.path;
    const userId = req.user._id;

    try {
        const { validRows, errors, totalRows } = await validateCsv(filePath);

        // Delete file after processing
        fs.unlinkSync(filePath);

        if (validRows.length === 0) {
            throw new ApiError(400, "No valid rows found in CSV", errors);
        }

        // Fetch user's social accounts to map platform -> socialAccountId
        const accounts = await SocialAccount.find({ organizationId: req.user.organizationId });
        const accountMap = {}; // platform -> accountId
        accounts.forEach(acc => {
            accountMap[acc.platform] = acc._id;
        });

        const postsToCreate = [];
        const creationErrors = [];

        validRows.forEach((row, index) => {
            const accountId = accountMap[row.platform];
            if (!accountId) {
                creationErrors.push({
                    row: index + 1,
                    message: `No connected account found for platform: ${row.platform}`
                });
                return;
            }

            postsToCreate.push({
                userId,
                organizationId: req.user.organizationId,
                socialAccountId: accountId,
                platform: row.platform,
                caption: row.caption,
                scheduledAt: row.scheduledAt,
                // TODO: Handle mediaUrl if needed (download & upload to cloud?)
                status: "pending"
            });
        });

        if (postsToCreate.length === 0) {
            throw new ApiError(400, "Analysis complete. logic validation failed.", [...errors, ...creationErrors]);
        }

        const createdPosts = await ScheduledPost.insertMany(postsToCreate);

        // Emit events
        createdPosts.forEach(post => {
            eventBus.emit(EVENTS.POST_CREATED, {
                postId: post._id,
                userId,
                organizationId: req.user.organizationId,
                platform: post.platform,
                scheduledAt: post.scheduledAt
            });
        });

        return res.status(201).json(
            new ApiResponse(201, {
                totalProcessed: totalRows,
                successful: createdPosts.length,
                failed: errors.length + creationErrors.length,
                errors: [...errors, ...creationErrors]
            }, `Successfully scheduled ${createdPosts.length} posts`)
        );

    } catch (error) {
        // Clean up file if still exists
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw error;
    }
});


const updatePostStatus = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { status, comment } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!["approved", "rejected", "scheduled", "draft"].includes(status)) {
        throw new ApiError(400, "Invalid status update");
    }

    // Authorization checks
    if (status === "approved" || status === "rejected") {
        if (!["admin", "reviewer"].includes(userRole)) {
            throw new ApiError(403, "Only Reviewers or Admins can approve/reject posts");
        }
    }

    if (status === "scheduled") {
        if (!["admin", "publisher", "reviewer"].includes(userRole)) {
            throw new ApiError(403, "You do not have permission to schedule posts");
        }
    }

    const post = await ScheduledPost.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Update post
    post.status = status;
    post.approvalHistory.push({
        action: status,
        userId: userId,
        comment: comment || `Status updated to ${status}`
    });

    await post.save();

    // Emit event
    eventBus.emit(EVENTS.POST_UPDATED, { // Assuming generic update event or create specific ones
        postId: post._id,
        userId: post.userId,
        organizationId: req.user.organizationId,
        status: post.status,
        updatedBy: userId
    });

    return res.status(200).json(
        new ApiResponse(200, post, `Post ${status} successfully`)
    );
});

const getAccountStats = asyncHandler(async (req, res) => {
    const { accountId } = req.params;
    const organizationId = req.user.organizationId;

    const stats = await getPostStatsSummary(organizationId, accountId);

    return res.status(200).json(
        new ApiResponse(200, stats, "Account stats fetched successfully")
    );
});

export {
    createScheduledPost,
    updateScheduledPost,
    getPostVersions,
    rollbackPostVersion,
    getScheduledPosts,
    deleteScheduledPost,
    getDashboardStats,
    getAnalytics,
    getSmartSuggestions,
    bulkCreateScheduledPosts,
    updatePostStatus,
    getAccountStats,
    getScheduledPostById,
};
