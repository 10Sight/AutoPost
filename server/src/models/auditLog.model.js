import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false, // Can be null for system actions
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
            index: true,
        },
        entityId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        entityType: {
            type: String,
            required: true,
            default: "ScheduledPost",
        },
        metadata: {
            type: Object, // Flexible field for any extra details
        },
        timestamp: {
            type: Date,
            default: Date.now,
            immutable: true, // Cannot be changed once created
            index: true,
        },
    },
    {
        timestamps: false, // We use our own immutable timestamp
        versionKey: false,
    }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
