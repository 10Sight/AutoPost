import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { ScheduledPost } from "../models/scheduledPost.model.js";
import { Media } from "../models/media.model.js";
import youtubeService from "../services/youtube.service.js";
import { google } from "googleapis";
import { MEDIA_RULES } from "../utils/mediaRules.js";
import { validateYouTubeMetadata } from "../utils/youtubeValidator.js";
import { SystemSettings } from "../models/systemSettings.model.js";
import * as usageService from "../services/usage.service.js";

/**
 * @desc    Get global YouTube quota metrics (Admin only)
 * @route   GET /api/v1/youtube/quota-metrics
 */
const getYouTubeQuotaMetrics = asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === "admin";
    const usage = await usageService.getOrCreateUsage(req.user.organizationId);

    const response = {
        organization: {
            used: usage.youtubeQuotaUsed,
            limit: usage.youtubeQuotaLimit
        }
    };

    if (isAdmin) {
        const settings = await SystemSettings.getSettings();
        response.global = {
            used: settings.youtubeQuotaUsed,
            limit: settings.youtubeQuotaLimit,
            resetAt: settings.lastQuotaReset
        };
    }

    return res
        .status(200)
        .json(new ApiResponse(200, response, "YouTube quota metrics fetched successfully"));
});

/**
 * @desc    Generate YouTube OAuth URL
 * @route   GET /api/v1/youtube/auth
 */
const getYouTubeAuthUrl = asyncHandler(async (req, res) => {
    const oauth2Client = youtubeService.getOAuthClient();
    const state = req.user._id.toString();

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly",
        ],
        state: state,
        prompt: "consent",
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { url }, "YouTube auth URL generated"));
});

/**
 * @desc    Handle YouTube OAuth callback
 * @route   GET /api/v1/youtube/callback
 */
const youtubeCallback = asyncHandler(async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        throw new ApiError(400, "Authorization code is required");
    }

    if (state !== req.user._id.toString()) {
        throw new ApiError(403, "Invalid state parameter");
    }

    const oauth2Client = youtubeService.getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube({
        version: "v3",
        auth: oauth2Client,
    });

    const channelRes = await youtube.channels.list({
        part: "snippet,statistics",
        mine: true,
    });

    if (!channelRes.data.items || channelRes.data.items.length === 0) {
        throw new ApiError(404, "No YouTube channel found for this account");
    }

    const channel = channelRes.data.items[0];
    const { id: channelId, snippet, statistics } = channel;

    const account = await SocialAccount.findOneAndUpdate(
        { organizationId: req.user.organizationId, platform: "youtube" },
        {
            userId: req.user._id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || undefined,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            platformUserId: channelId,
            platformUserName: snippet.title,
            channelId: channelId,
            channelTitle: snippet.title,
            scopes: tokens.scope ? tokens.scope.split(" ") : [],
            metadata: {
                thumbnail: snippet.thumbnails?.default?.url,
                customUrl: snippet.customUrl,
                statistics,
                ...snippet,
            },
        },
        { new: true, upsert: true }
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Emit Audit Event
    const { eventBus } = await import("../utils/eventBus.js");
    const { EVENTS } = await import("../events/events.js");

    eventBus.emit(EVENTS.YOUTUBE_CHANNEL_CONNECTED, {
        userId: req.user._id,
        organizationId: req.user.organizationId,
        accountId: account._id,
        platform: "youtube",
        channelTitle: snippet.title
    });

    return res.redirect(`${frontendUrl}/dashboard/settings?platform=youtube&status=success`);
});

/**
 * @desc    Get connected YouTube channel info
 * @route   GET /api/v1/youtube/channel
 */
const getChannelInfo = asyncHandler(async (req, res) => {
    const account = await SocialAccount.findOne({
        organizationId: req.user.organizationId,
        platform: "youtube",
    });

    if (!account) {
        throw new ApiError(404, "YouTube account not connected");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, account, "Channel info fetched successfully"));
});

/**
 * @desc    Disconnect YouTube channel
 * @route   DELETE /api/v1/youtube/channel
 */
const disconnectChannel = asyncHandler(async (req, res) => {
    const result = await SocialAccount.findOneAndDelete({
        organizationId: req.user.organizationId,
        platform: "youtube",
    });

    if (!result) {
        throw new ApiError(404, "YouTube account not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "YouTube account disconnected successfully"));
});

/**
 * @desc    Validate video against YouTube rules
 * @route   POST /api/v1/youtube/validate
 */
const validateVideo = asyncHandler(async (req, res) => {
    const { mediaId } = req.body;

    if (!mediaId) {
        throw new ApiError(400, "Media ID is required");
    }

    const media = await Media.findById(mediaId);
    if (!media) {
        throw new ApiError(404, "Media not found");
    }

    if (media.type !== "video") {
        throw new ApiError(400, "Media must be a video for YouTube");
    }

    const rules = MEDIA_RULES.youtube.video;
    const errors = [];

    // Size check
    if (media.size > rules.maxSize) {
        errors.push(`Video size exceeds YouTube limit of 1GB. Current: ${(media.size / (1024 * 1024)).toFixed(0)}MB`);
    }

    // Duration check
    if (media.duration > rules.maxDuration) {
        errors.push(`Video duration exceeds YouTube limit of 12 hours. Current: ${(media.duration / 3600).toFixed(1)} hours`);
    }

    // Format check
    const format = media.url.split(".").pop().toLowerCase();
    if (!rules.formats.includes(format)) {
        errors.push(`Unsupported video format: ${format}. Supported: ${rules.formats.join(", ")}`);
    }

    if (errors.length > 0) {
        return res
            .status(400)
            .json(new ApiResponse(400, { isValid: false, errors }, "Video validation failed"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { isValid: true }, "Video is valid for YouTube"));
});

/**
 * @desc    Schedule YouTube specialized post
 * @route   POST /api/v1/youtube/schedule
 */
const scheduleYouTubePost = asyncHandler(async (req, res) => {
    const {
        socialAccountId,
        mediaId,
        caption,
        scheduledAt,
        youtubePrivacyStatus,
        youtubeTags,
        youtubeCategoryId,
        youtubeThumbnailUrl,
        publishAt
    } = req.body;

    if (!socialAccountId || !mediaId || !scheduledAt) {
        throw new ApiError(400, "socialAccountId, mediaId, and scheduledAt are required");
    }

    // 1. Validate Media
    const media = await Media.findById(mediaId);
    if (!media || media.type !== "video") {
        throw new ApiError(400, "Valid video media is required for YouTube");
    }

    const rules = MEDIA_RULES.youtube.video;
    if (media.size > rules.maxSize) throw new ApiError(400, "Video size exceeds 1GB limit");
    if (media.duration > rules.maxDuration) throw new ApiError(400, "Video exceeds 12 hour limit");

    // 2. Validate Metadata (Title based on first line, then tags/description)
    const lines = caption.split("\n");
    const title = lines[0] || "Untitled Video";
    const description = lines.slice(1).join("\n") || caption;

    const metadataValidation = validateYouTubeMetadata({
        title,
        description,
        tags: youtubeTags
    });

    if (!metadataValidation.isValid) {
        throw new ApiError(400, "Metadata validation failed", metadataValidation.errors);
    }

    // 3. Validate Account
    const account = await SocialAccount.findOne({
        _id: socialAccountId,
        organizationId: req.user.organizationId,
        platform: "youtube"
    });

    if (!account) {
        throw new ApiError(404, "YouTube account not found");
    }

    // 4. Quota Check (Static preview of cost)
    // Video insert costs 1600, thumbnail (if eventual) costs 50
    const estimatedCost = 1600 + (youtubeThumbnailUrl ? 50 : 0);
    await youtubeService.checkQuotaAvailability(req.user.organizationId, estimatedCost);

    const post = await ScheduledPost.create({
        userId: req.user._id,
        organizationId: req.user.organizationId,
        socialAccountId,
        platform: "youtube",
        mediaId,
        caption,
        scheduledAt,
        status: req.user.role === "creator" ? "pending_approval" : "scheduled",
        youtubePrivacyStatus,
        youtubeTags,
        youtubeCategoryId,
        youtubeThumbnailUrl,
        publishAt: publishAt || scheduledAt // Default to scheduledAt if publishAt not provided
    });

    // Emit Audit Event
    const { eventBus } = await import("../utils/eventBus.js");
    const { EVENTS } = await import("../events/events.js");

    eventBus.emit(EVENTS.YOUTUBE_VIDEO_SCHEDULED, {
        userId: req.user._id,
        organizationId: req.user.organizationId,
        postId: post._id,
        platform: "youtube",
        title: title,
        scheduledAt: scheduledAt
    });

    return res
        .status(201)
        .json(new ApiResponse(201, post, "YouTube post scheduled successfully"));
});

/**
 * @desc    Get YouTube Analytics (Videos per month, Success Rate)
 * @route   GET /api/v1/youtube/analytics
 */
const getYouTubeAnalytics = asyncHandler(async (req, res) => {
    const { organizationId } = req.user;

    // 1. Videos Per Month (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await ScheduledPost.aggregate([
        {
            $match: {
                organizationId: organizationId,
                platform: "youtube",
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 },
                monthName: { $first: { $dateToString: { format: "%B", date: "$createdAt" } } }
            }
        },
        { $sort: { "_id": 1 } } // Sort by month index
    ]);

    // 2. Upload Success Rate (All Time)
    const totalPosts = await ScheduledPost.countDocuments({
        organizationId: organizationId,
        platform: "youtube"
    });

    const failedPosts = await ScheduledPost.countDocuments({
        organizationId: organizationId,
        platform: "youtube",
        status: "failed"
    });

    const successRate = totalPosts > 0
        ? (((totalPosts - failedPosts) / totalPosts) * 100).toFixed(1)
        : 100;

    return res.status(200).json(
        new ApiResponse(200, {
            monthlyStats,
            successRate: parseFloat(successRate),
            totalVideos: totalPosts
        }, "YouTube analytics fetched successfully")
    );
});

export {
    getYouTubeAuthUrl,
    youtubeCallback,
    getChannelInfo,
    disconnectChannel,
    validateVideo,
    scheduleYouTubePost,
    getYouTubeQuotaMetrics,
    getYouTubeAnalytics
};
