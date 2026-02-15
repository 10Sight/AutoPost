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
        scheduledAt: post.scheduledAt,
        platform: post.platform,
        createdBy: userId,
        changeLog,
    });
};

const createScheduledPost = asyncHandler(async (req, res) => {
    const { socialAccountId, platform, mediaId, caption, scheduledAt } =
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

    let media = null;
    let mediaIntelligenceWarnings = [];
    if (mediaId) {
        media = await Media.findById(mediaId);
        if (!media) throw new ApiError(404, "Media not found");

        const compatibility = validateMediaCompatibility(media, platform);
        if (compatibility.errors.length > 0) {
            throw new ApiError(400, compatibility.errors[0], compatibility.errors);
        }
        mediaIntelligenceWarnings = compatibility.warnings;
    }

    // Evaluate Rules
    const ruleResults = await evaluateRules(
        req.user.organizationId,
        "BEFORE_SCHEDULE",
        { caption, platform, scheduledAt, media }
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
        mediaId,
        caption,
        scheduledAt,
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

    eventBus.emit(EVENTS.POST_CREATED, {
        postId: post._id,
        userId: req.user._id,
        organizationId: req.user.organizationId,
        platform: post.platform,
        scheduledAt: post.scheduledAt,
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
    const { caption, mediaId, scheduledAt, changeLog } = req.body;

    const post = await ScheduledPost.findOne({ _id: postId, organizationId: req.user.organizationId });
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (post.status === "published") {
        throw new ApiError(400, "Cannot edit a post that has already been published");
    }

    // Update post fields
    if (caption !== undefined) post.caption = caption;
    if (mediaId !== undefined) {
        let media = null;
        if (mediaId) {
            media = await Media.findById(mediaId);
            if (!media) throw new ApiError(404, "Media not found");

            const compatibility = validateMediaCompatibility(media, post.platform);
            if (compatibility.errors.length > 0) {
                throw new ApiError(400, compatibility.errors[0], compatibility.errors);
            }
            req.mediaWarnings = compatibility.warnings;
        }
        post.mediaId = mediaId || null;
        // Re-evaluate rules on update
        const ruleResults = await evaluateRules(
            req.user.organizationId,
            "BEFORE_SCHEDULE",
            {
                caption: caption !== undefined ? caption : post.caption,
                platform: post.platform,
                scheduledAt: scheduledAt !== undefined ? scheduledAt : post.scheduledAt,
                media
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

    eventBus.emit(EVENTS.POST_UPDATED, {
        postId: post._id,
        userId: req.user._id,
        organizationId: req.user.organizationId,
        platform: post.platform,
        scheduledAt: post.scheduledAt,
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
    const { page = 1, limit = 20, status } = req.query;
    const query = { organizationId: req.user.organizationId };

    if (status) {
        query.status = status;
    }

    const posts = await ScheduledPost.find(query)
        .populate("mediaId")
        .populate("socialAccountId", "platform platformUserName")
        .sort({ scheduledAt: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await ScheduledPost.countDocuments(query);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    posts,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit),
                    },
                },
                "Scheduled posts fetched successfully"
            )
        );
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

    // 1. Get counts by status
    const statusCounts = await ScheduledPost.aggregate([
        { $match: { organizationId: organizationId } },
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
        if (item._id === "pending") stats.pending = item.count;
        if (item._id === "posted") stats.posted = item.count;
        if (item._id === "failed") stats.failed = item.count;
        stats.total += item.count;
    });

    // 2. Get daily activity for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyActivity = await ScheduledPost.aggregate([
        {
            $match: {
                organizationId: organizationId,
                scheduledAt: { $gte: sevenDaysAgo },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$scheduledAt" },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Fill in missing days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split("T")[0];
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

        const found = dailyActivity.find((item) => item._id === dateString);
        chartData.push({
            name: dayName,
            date: dateString,
            total: found ? found.count : 0,
        });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                stats,
                chartData,
            },
            "Dashboard stats fetched successfully"
        )
    );
});

const getAnalytics = asyncHandler(async (req, res) => {
    const organizationId = req.user.organizationId;

    // 1. Platform Distribution (Pie Chart)
    const platformDistribution = await ScheduledPost.aggregate([
        { $match: { organizationId: organizationId } },
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
        { $match: { organizationId: organizationId } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
        { $project: { name: "$_id", value: "$count", _id: 0 } }
    ]);

    // 3. Weekly Volume Comparison (This Week vs Last Week) - Simplified for now to just daily volume
    // Reuse existing chartData logic or extend it. Let's get 30 days for analytics.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyVolume = await ScheduledPost.aggregate([
        {
            $match: {
                organizationId: organizationId,
                scheduledAt: { $gte: thirtyDaysAgo },
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$scheduledAt" } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Fill missing days
    const volumeData = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split("T")[0];
        const dayOfMonth = d.getDate();

        const found = dailyVolume.find(item => item._id === dateString);
        volumeData.push({
            date: dateString,
            day: dayOfMonth,
            posts: found ? found.count : 0
        });
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
    updatePostStatus
};
