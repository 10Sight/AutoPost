import mongoose, { Schema } from "mongoose";

const mediaFolderSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxLength: 50,
        },
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
        groupId: {
            type: Schema.Types.ObjectId,
            ref: "AccountGroup",
            index: true,
            default: null,
        },
        isDefault: {
            type: Boolean,
            default: false, // Used for generic "Inbox" or "Uncategorized" logic if needed
        }
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate folder names for the same organization
mediaFolderSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const MediaFolder = mongoose.model("MediaFolder", mediaFolderSchema);
