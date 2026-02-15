import mongoose, { Schema } from "mongoose";

const ruleSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        trigger: {
            type: String,
            enum: ["BEFORE_SCHEDULE", "POST_PUBLISHED", "POST_FAILED", "USER_LOGIN"],
            required: true,
        },
        conditions: [
            {
                field: {
                    type: String,
                    required: true, // e.g., "media.size", "caption", "scheduledAt"
                },
                operator: {
                    type: String,
                    enum: ["eq", "neq", "gt", "lt", "contains", "not_contains", "between"],
                    required: true,
                },
                value: {
                    type: Schema.Types.Mixed,
                    required: true,
                },
            },
        ],
        actions: [
            {
                type: {
                    type: String,
                    enum: ["BLOCK", "WARN", "NOTIFY", "LOG"],
                    required: true,
                },
                message: {
                    type: String,
                    required: true,
                },
                metadata: {
                    type: Schema.Types.Mixed,
                },
            },
        ],
        active: {
            type: Boolean,
            default: true,
        },
        priority: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const Rule = mongoose.model("Rule", ruleSchema);
