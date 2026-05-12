import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { config } from "./config/env.config.js";
import { handleStripeWebhook } from "./controllers/billing.controller.js";
import { ApiError } from "./utils/ApiError.js";
import { logger } from "./utils/logger.js";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts, please try again after 15 minutes",
});

app.use(morgan("dev"));
app.use(compression()); // Compress all responses
app.use(limiter);

app.use(
    cors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "https://auto-posting-app-145f.onrender.com",
                config.CORS_ORIGIN
            ].filter(Boolean);

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// Stripe Webhook (Raw body required for signature verification)
app.post("/api/v1/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "script-src": ["'self'", "'unsafe-inline'", "https://*.razorpay.com", "https://checkout.razorpay.com", "https://accounts.google.com"],
                "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
                "img-src": ["'self'", "data:", "blob:", "https:"],
                "media-src": ["'self'", "data:", "blob:", "https:"],
                "connect-src": ["'self'", "blob:", "https:", "wss:", "https://api.cloudinary.com", "https://*.razorpay.com"],
                "frame-src": ["'self'", "https://*.razorpay.com", "https://checkout.razorpay.com", "https://accounts.google.com"],
                "font-src": ["'self'", "https://fonts.gstatic.com"]
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Routes import
import authRouter from "./routes/auth.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import userRouter from "./routes/user.routes.js";
import scheduledPostRouter from "./routes/scheduledPost.routes.js";
import socialAccountRouter from "./routes/socialAccount.routes.js";
import mediaRouter from "./routes/media.routes.js";
import auditLogRouter from "./routes/auditLog.routes.js";
import usageRouter from "./routes/usage.routes.js";
import organizationRouter from "./routes/organization.routes.js";
import ruleRouter from "./routes/rule.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import youtubeRouter from "./routes/youtube.routes.js";
import linkedinRouter from "./routes/linkedin.routes.js";
import xRouter from "./routes/x.routes.js";
import facebookRouter from "./routes/facebook.routes.js";
import accountGroupRouter from "./routes/accountGroup.routes.js";
import superadminRouter from "./routes/superadmin.routes.js";
import engagementRouter from "./routes/engagement.routes.js";
import invitationRouter from "./routes/invitation.routes.js";

// Routes declaration
app.use("/api/v1/auth", authLimiter, authRouter);

// Apply tenant context to all other routes
import { verifyJWT } from "./middlewares/auth.middleware.js";
import { tenantMiddleware } from "./middlewares/tenant.middleware.js";

app.use("/api/v1/superadmin", superadminRouter);
app.use("/api/v1/users", verifyJWT, userRouter);
app.use("/api/v1/scheduled-posts", verifyJWT, tenantMiddleware, scheduledPostRouter);
app.use("/api/v1/social-accounts", verifyJWT, tenantMiddleware, socialAccountRouter);
app.use("/api/v1/youtube", youtubeRouter);
app.use("/api/v1/linkedin", linkedinRouter);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/x", xRouter);
app.use("/api/v1/facebook", facebookRouter);
app.use("/api/v1/media", verifyJWT, tenantMiddleware, mediaRouter);
app.use("/api/v1/audit-logs", verifyJWT, tenantMiddleware, auditLogRouter);
app.use("/api/v1/usage", verifyJWT, tenantMiddleware, usageRouter);
app.use("/api/v1/organization", organizationRouter);
app.use("/api/v1/rules", verifyJWT, tenantMiddleware, ruleRouter);
app.use("/api/v1/notifications", verifyJWT, tenantMiddleware, notificationRouter);
app.use("/api/v1/account-groups", verifyJWT, tenantMiddleware, accountGroupRouter);
app.use("/api/v1/engagement", engagementRouter);
app.use("/api/v1/invitations", invitationRouter);

// Serve Frontend in Production
if (config.NODE_ENV === "production") {
    const buildPath = path.resolve(__dirname, "../../client/dist");

    if (fs.existsSync(buildPath)) {
        app.use(express.static(buildPath, {
            maxAge: '1d',
            etag: true
        }));

        app.get("*", (req, res) => {
            if (!req.path.startsWith("/api/") && !req.path.includes(".")) {
                res.sendFile(path.join(buildPath, "index.html"));
            } else if (!req.path.startsWith("/api/")) {
                res.status(404).send("Asset Not Found");
            }
        });
    }
}

// Global Error Handler
app.use((err, req, res, next) => {
    // Standardized logging for production auditing
    logger.error(`${req.method} ${req.url} - ${err.message}`, {
        stack: config.NODE_ENV === "development" ? err.stack : undefined,
        user: req.user?._id,
        org: req.organizationId
    });

    const response = {
        success: false,
        message: err.message || "Internal Server Error",
    };

    if (err instanceof ApiError) {
        response.success = err.success;
        response.errors = err.errors;
        response.data = err.data;
        res.status(err.statusCode);
    } else {
        res.status(500);
    }

    if (config.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    return res.json(response);
});

export { app };
