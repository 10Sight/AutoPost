import mongoose, { Schema } from "mongoose";

const usageSchema = new Schema(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true,
            index: true,
        },
        cycleStart: {
            type: Date,
            required: true,
            default: Date.now,
        },
        cycleEnd: {
            type: Date,
            required: true,
            default: () => {
                const now = new Date();
                return new Date(now.setMonth(now.getMonth() + 1));
            },
        },
        // Posts Tracking
        postsLimit: {
            type: Number,
            default: 100,
        },
        postsUsed: {
            type: Number,
            default: 0,
        },
        // Platforms Tracking
        platformsLimit: {
            type: Number,
            default: 5,
        },
        platformsUsed: {
            type: Number,
            default: 0,
        },
        // Storage Tracking (in bytes)
        storageLimitBytes: {
            type: Number,
            default: 500 * 1024 * 1024, // 500 MB
        },
        storageUsedBytes: {
            type: Number,
            default: 0,
        },
        // Team Tracking
        teamLimit: {
            type: Number,
            default: 5,
        },
        teamUsed: {
            type: Number,
            default: 1, // The account owner themselves
        },
        // YouTube Specific Quota
        youtubeQuotaLimit: {
            type: Number,
            default: 5000, // High enough for normal SaaS use per tenant
        },
        youtubeQuotaUsed: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for quick lookup is already provided by unique: true in schema definition
export const Usage = mongoose.model("Usage", usageSchema);
