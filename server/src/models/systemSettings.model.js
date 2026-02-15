import mongoose, { Schema } from "mongoose";

const systemSettingsSchema = new Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
            default: "global_settings"
        },
        youtubeQuotaUsed: {
            type: Number,
            default: 0,
        },
        youtubeQuotaLimit: {
            type: Number,
            default: 10000, // Google's default free tier limit
        },
        lastQuotaReset: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Helper to check and reset quota if it's a new day (Pacific Time roughly)
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ key: "global_settings" });
    if (!settings) {
        settings = await this.create({ key: "global_settings" });
    }

    const now = new Date();
    const lastReset = new Date(settings.lastQuotaReset);

    // Reset if it's a different day in UTC (Google resets around midnight PT)
    if (now.getUTCDate() !== lastReset.getUTCDate() ||
        now.getUTCMonth() !== lastReset.getUTCMonth() ||
        now.getUTCFullYear() !== lastReset.getUTCFullYear()) {

        settings.youtubeQuotaUsed = 0;
        settings.lastQuotaReset = now;
        await settings.save();
    }

    return settings;
};

export const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);
