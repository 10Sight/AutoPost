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
        socialAccountId: {
            type: Schema.Types.ObjectId,
            ref: "SocialAccount",
            index: true,
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: "AccountGroup",
            index: true,
        },
        ipAddress: String,
        userAgent: String,
        metadata: {
            type: Object, // Flexible field for any extra details
        },
        timestamp: {
            type: Date,
            default: Date.now,
            immutable: true, // Cannot be changed once created
        },
    },
    {
        timestamps: false, // We use our own immutable timestamp
        versionKey: false,
    }
);

// High-performance compound index for group-level filtering
auditLogSchema.index({ organizationId: 1, groupId: 1, timestamp: -1 });

// Production-level retention policy: auto-delete logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
