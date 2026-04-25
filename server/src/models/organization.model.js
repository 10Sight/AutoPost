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
            accentColor: {
                type: String,
                default: "#4f46e5",
            },
            backgroundColor: {
                type: String,
                default: "#ffffff",
            },
            faviconUrl: {
                type: String,
            },
        },
        active: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            enum: ["active", "suspended", "maintenance"],
            default: "active",
        },
        quota: {
            maxAccounts: { type: Number, default: 5 },
            maxPostsPerMonth: { type: Number, default: 100 },
            storageLimitGB: { type: Number, default: 1 },
        },
        settings: {
            type: Schema.Types.Mixed,
            default: {},
        },
        billing: {
            stripeCustomerId: {
                type: String,
                index: true
            },
            stripeSubscriptionId: {
                type: String,
                index: true
            },
            plan: {
                type: String,
                enum: ["free", "pro", "enterprise"],
                default: "free"
            },
            subscriptionStatus: {
                type: String,
                enum: ["active", "past_due", "canceled", "trialing", "incomplete", "unpaid"],
                default: "incomplete"
            },
            currentPeriodEnd: {
                type: Date
            }
        }
    },
    {
        timestamps: true,
    }
);

export const Organization = mongoose.model("Organization", organizationSchema);
