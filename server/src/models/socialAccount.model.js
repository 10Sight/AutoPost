import { encrypt, decrypt } from "../utils/encryption.js";
import { Schema, model } from "mongoose";

const socialAccountSchema = new Schema(
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
        platform: {
            type: String,
            enum: ["instagram", "facebook", "linkedin", "x", "youtube"],
            required: true,
        },
        platformUserId: {
            type: String, // ID of the user on the social platform
        },
        platformUserName: {
            type: String, // Handle or name on the social platform
        },
        accessToken: {
            type: String,
            required: true,
            set: (v) => encrypt(v),
            get: (v) => decrypt(v),
        },
        refreshToken: {
            type: String,
            set: (v) => encrypt(v),
            get: (v) => decrypt(v),
        },
        expiresAt: {
            type: Date,
        },
        channelId: {
            type: String,
        },
        channelTitle: {
            type: String,
        },
        scopes: [{
            type: String,
        }],
        thumbnail: {
            type: String,
        },
        avatar: {
            type: String,
        },
        picture: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed, // Store any other platform-specific data
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true, virtuals: true },
        toObject: { getters: true, virtuals: true }
    }
);

// Virtual for a consistent display name across all platforms
socialAccountSchema.virtual("displayName").get(function () {
    if (this.platform === "youtube") {
        return this.channelTitle || this.platformUserName || "YouTube Channel";
    }
    return this.platformUserName || "Unknown Account";
});

// Virtual for a consistent avatar URL across all platforms
socialAccountSchema.virtual("avatarUrl").get(function () {
    return this.picture || 
           this.avatar || 
           this.thumbnail || 
           this.metadata?.thumbnail || 
           this.metadata?.picture || 
           this.metadata?.picture?.data?.url ||
           this.metadata?.profile_picture_url ||
           this.metadata?.profile_image_url ||
           this.metadata?.thumbnails?.default?.url ||
           null;
});

// Ensure a tenant can link multiple accounts per platform if the User IDs are different (e.g., Profile + Page)
socialAccountSchema.index({ organizationId: 1, platform: 1, platformUserId: 1 }, { unique: true });

export const SocialAccount = model(
    "SocialAccount",
    socialAccountSchema
);
