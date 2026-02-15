import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config/env.config.js";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: String,
            enum: ["user", "admin", "creator", "reviewer", "publisher"],
            default: "user",
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role,
            organizationId: this.organizationId,
        },
        config.JWT_SECRET,
        {
            expiresIn: config.JWT_EXPIRES_IN,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        config.REFRESH_TOKEN_SECRET,
        {
            expiresIn: config.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
