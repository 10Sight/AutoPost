import mongoose, { Schema } from "mongoose";

const invitationSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "publisher", "reviewer", "creator", "user"],
            default: "user",
        },
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "expired"],
            default: "pending",
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-expire documents after 7 days if they haven't been processed
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invitation = mongoose.model("Invitation", invitationSchema);
