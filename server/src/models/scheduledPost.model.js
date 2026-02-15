import mongoose, { Schema } from "mongoose";

const scheduledPostSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        socialAccountId: {
            type: Schema.Types.ObjectId,
            ref: "SocialAccount",
            required: true,
        },
        platform: {
            type: String,
            enum: ["instagram", "facebook", "linkedin", "x", "youtube"],
            required: true,
        },
        mediaId: {
            type: Schema.Types.ObjectId,
            ref: "Media",
        },
        caption: {
            type: String,
        },
        scheduledAt: {
            type: Date,
            required: true,
            index: true, // Important for the cron query
        },
        status: {
            type: String,
            enum: ["draft", "pending_approval", "approved", "scheduled", "processing", "rejected", "published", "failed", "cancelled"],
            default: "draft",
            index: true,
        },
        approvalHistory: [
            {
                action: { type: String, enum: ["submitted", "approved", "rejected", "scheduled"] },
                userId: { type: Schema.Types.ObjectId, ref: "User" },
                timestamp: { type: Date, default: Date.now },
                comment: String,
            }
        ],
        error: {
            type: String, // To store error message if failed
        },
        platformPostId: {
            type: String, // ID of the created post on the platform
        },
        retryCount: {
            type: Number,
            default: 0,
        },
        maxRetries: {
            type: Number,
            default: 3,
        },
        nextRetryAt: {
            type: Date,
        },
        logs: [
            {
                timestamp: { type: Date, default: Date.now },
                level: { type: String, enum: ["info", "warn", "error"] },
                message: String,
            },
        ],
        isEvergreen: {
            type: Boolean,
            default: false,
        },
        evergreenInterval: {
            type: Number, // Interval in days
            default: 30,
        },
        evergreenStatus: {
            type: String,
            enum: ["active", "paused", "stopped"],
            default: "active",
        },
        analytics: {
            likes: { type: Number, default: 0 },
            comments: { type: Number, default: 0 },
            shares: { type: Number, default: 0 },
            impressions: { type: Number, default: 0 },
            lastUpdated: { type: Date },
        },
        youtubePrivacyStatus: {
            type: String,
            enum: ["public", "unlisted", "private"],
            default: "public",
        },
        youtubeCategoryId: {
            type: String,
        },
        youtubeTags: [{
            type: String,
        }],
        youtubeThumbnailUrl: {
            type: String,
        },
        publishAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export const ScheduledPost = mongoose.model(
    "ScheduledPost",
    scheduledPostSchema
);
