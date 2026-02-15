import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            // If null, it could be a system-wide notification for the org
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["INFO", "SUCCESS", "WARNING", "ERROR"],
            default: "INFO",
        },
        link: {
            type: String, // Optional link to a specific entity
        },
        read: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

// Auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification = mongoose.model("Notification", notificationSchema);
