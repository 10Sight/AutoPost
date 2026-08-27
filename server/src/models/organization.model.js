import mongoose, { Schema } from "mongoose";
import { encrypt, decrypt } from "../utils/encryption.js";

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
            maxAiGenerationsPerMonth: { type: Number, default: 30 },
        },
        settings: {
            type: Schema.Types.Mixed,
            default: {},
        },
        // BYOK provider keys. `select: false` keeps these out of every default
        // query (.find/.findOne/...) — callers must explicitly opt in with
        // `.select('+aiKeys.gemini +aiKeys.openai +aiKeys.anthropic +aiKeys.runway')`.
        // The toJSON transform below is a second, independent layer: even a
        // handler that loads the keys and then accidentally serializes the
        // whole document will not leak them to the client.
        aiKeys: {
            gemini: { type: String, set: encrypt, get: decrypt, select: false },
            openai: { type: String, set: encrypt, get: decrypt, select: false },
            anthropic: { type: String, set: encrypt, get: decrypt, select: false },
            runway: { type: String, set: encrypt, get: decrypt, select: false },
        },
        // Google OAuth connection used to drive the Gemini API with a rotating
        // user access token instead of a static API key. `projectId` is the GCP
        // project billed for generation (required by generativelanguage.googleapis.com
        // via the `x-goog-user-project` header when authenticating with OAuth) —
        // it is not a secret and is intentionally left selectable by default.
        aiOAuth: {
            gemini: {
                accessToken: { type: String, set: encrypt, get: decrypt, select: false },
                refreshToken: { type: String, set: encrypt, get: decrypt, select: false },
                expiryDate: { type: Date, select: false },
                projectId: { type: String, trim: true },
                connectedEmail: { type: String },
                connectedAt: { type: Date },
            },
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
            billingCycle: {
                type: String,
                enum: ["monthly", "yearly"],
                default: "monthly"
            },
            subscriptionStatus: {
                type: String,
                enum: ["active", "past_due", "canceled", "trialing", "incomplete", "unpaid", "cancelling"],
                default: "incomplete"
            },
            currentPeriodEnd: {
                type: Date
            },
            // Professional Billing Profile
            taxId: {
                type: String,
                trim: true
            },
            companyName: {
                type: String,
                trim: true
            },
            address: {
                type: String,
                trim: true
            }
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                delete ret.aiKeys;
                // Non-secret connection status (email/date/projectId) is fine to expose;
                // strip the token fields as a second guard even though `select: false`
                // already keeps them out of default queries.
                if (ret.aiOAuth?.gemini) {
                    delete ret.aiOAuth.gemini.accessToken;
                    delete ret.aiOAuth.gemini.refreshToken;
                    delete ret.aiOAuth.gemini.expiryDate;
                }
                return ret;
            },
        },
    }
);

export const Organization = mongoose.model("Organization", organizationSchema);
