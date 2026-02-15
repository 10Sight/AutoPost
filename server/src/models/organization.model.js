import mongoose, { Schema } from "mongoose";

const organizationSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        customDomain: {
            type: String,
            unique: true,
            sparse: true, // Allows nulls while enforcing uniqueness for non-nulls
        },
        branding: {
            logoUrl: {
                type: String,
            },
            primaryColor: {
                type: String,
                default: "#2563eb", // Default primary blue
            },
            secondaryColor: {
                type: String,
                default: "#4f46e5",
            },
            faviconUrl: {
                type: String,
            },
        },
        active: {
            type: Boolean,
            default: true,
        },
        settings: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

export const Organization = mongoose.model("Organization", organizationSchema);
