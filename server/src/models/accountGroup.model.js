import { Schema, model } from "mongoose";

const accountGroupSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Group name is required"],
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
        accounts: [
            {
                type: Schema.Types.ObjectId,
                ref: "SocialAccount",
            },
        ],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Prevent duplicate group names within the same organization
accountGroupSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const AccountGroup = model("AccountGroup", accountGroupSchema);
