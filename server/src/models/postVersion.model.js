import mongoose, { Schema } from "mongoose";

const postVersionSchema = new Schema(
    {
        postId: {
            type: Schema.Types.ObjectId,
            ref: "ScheduledPost",
            required: true,
            index: true,
        },
        versionNumber: {
            type: Number,
            required: true,
        },
        caption: {
            type: String,
        },
        mediaId: {
            type: Schema.Types.ObjectId,
            ref: "Media",
        },
        scheduledAt: {
            type: Date,
            required: true,
        },
        platform: {
            type: String,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        changeLog: {
            type: String, // Optional description of changes
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt as it's immutable
    }
);

// Ensure version number is unique per post
postVersionSchema.index({ postId: 1, versionNumber: 1 }, { unique: true });

export const PostVersion = mongoose.model("PostVersion", postVersionSchema);
