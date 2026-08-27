import mongoose, { Schema } from "mongoose";

const aiJobSchema = new Schema(
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
        type: {
            type: String,
            enum: ["image", "video"],
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },
        prompt: {
            type: String,
            required: true,
        },
        style: {
            type: String,
        },
        aspectRatio: {
            type: String,
        },
        duration: {
            type: Number,
        },
        result: {
            type: Schema.Types.Mixed, // Stores the resulting Media model object once successfully processed
        },
        error: {
            type: String,
        },
        // How the result was actually produced. Defaults to "stock" — the honest
        // label for every job that existed before Runway integration — rather than
        // "generated", so historical/legacy rows never get mislabeled on read.
        source: {
            type: String,
            enum: ["stock", "generated"],
            default: "stock",
        },
    },
    {
        timestamps: true,
    }
);

export const AIJob = mongoose.model("AIJob", aiJobSchema);
