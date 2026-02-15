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
        metadata: {
            type: Schema.Types.Mixed, // Store any other platform-specific data
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);

// Ensure a tenant can only link one account per platform per organization (shared pool)
socialAccountSchema.index({ organizationId: 1, platform: 1 }, { unique: true });

export const SocialAccount = model(
    "SocialAccount",
    socialAccountSchema
);
