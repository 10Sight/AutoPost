import mongoose, { Schema } from "mongoose";

const mediaSchema = new Schema(
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
        url: {
            type: String,
            required: true,
        },
        publicId: {
            type: String, // Cloudinary public_id
        },
        type: {
            type: String,
            enum: ["image", "video"],
            required: true,
        },
        originalName: {
            type: String,
        },
        size: {
            type: Number,
        },
        mimeType: {
            type: String,
        },
        width: {
            type: Number,
        },
        height: {
            type: Number,
        },
        aspectRatio: {
            type: String, // e.g. "16:9"
        },
        duration: {
            type: Number, // in seconds, for videos
        },
        resolution: {
            type: String, // e.g. "1920x1080"
        },
        codec: {
            type: String, // e.g. "h264"
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

export const Media = mongoose.model("Media", mediaSchema);
