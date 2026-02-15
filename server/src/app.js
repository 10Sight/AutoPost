import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./config/env.config.js";

const app = express();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts, please try again after 15 minutes",
});

app.use(limiter);

app.use(
    cors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "https://autopost-k0pd.onrender.com",
                config.CORS_ORIGIN
            ].filter(Boolean);

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log("Blocked by CORS:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(helmet());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes import
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js"; // Keep userRouter as it's used in declaration
import scheduledPostRouter from "./routes/scheduledPost.routes.js";
import socialAccountRouter from "./routes/socialAccount.routes.js";
import mediaRouter from "./routes/media.routes.js";
import auditLogRouter from "./routes/auditLog.routes.js";
import usageRouter from "./routes/usage.routes.js";
import organizationRouter from "./routes/organization.routes.js";
import ruleRouter from "./routes/rule.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import youtubeRouter from "./routes/youtube.routes.js";

// Routes declaration
app.use("/api/v1/auth", authLimiter, authRouter);

// Apply tenant context to all other routes
import { verifyJWT } from "./middlewares/auth.middleware.js"; // Importing to use here
import { tenantMiddleware } from "./middlewares/tenant.middleware.js";

app.use("/api/v1/users", verifyJWT, userRouter);
app.use("/api/v1/scheduled-posts", verifyJWT, tenantMiddleware, scheduledPostRouter);
app.use("/api/v1/social-accounts", verifyJWT, tenantMiddleware, socialAccountRouter);
app.use("/api/v1/youtube", youtubeRouter);
app.use("/api/v1/media", verifyJWT, tenantMiddleware, mediaRouter);
app.use("/api/v1/audit-logs", verifyJWT, tenantMiddleware, auditLogRouter);
app.use("/api/v1/usage", verifyJWT, tenantMiddleware, usageRouter);
app.use("/api/v1/organization", verifyJWT, tenantMiddleware, organizationRouter);
app.use("/api/v1/rules", verifyJWT, tenantMiddleware, ruleRouter);
app.use("/api/v1/notifications", verifyJWT, tenantMiddleware, notificationRouter);

// Error handling middleware
import { ApiError } from "./utils/ApiError.js";

app.use((err, req, res, next) => {
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
