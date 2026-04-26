import mongoose, { Schema } from "mongoose";

const invoiceSchema = new Schema(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        invoiceId: {
            type: String,
            required: true,
            unique: true,
        },
        planName: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "usd",
        },
        status: {
            type: String,
            enum: ["paid", "open", "void", "uncollectible"],
            default: "paid",
        },
        billingDate: {
            type: Date,
            default: Date.now,
        },
        paymentMethod: {
            type: String,
            default: "stripe",
        },
        pdfUrl: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
