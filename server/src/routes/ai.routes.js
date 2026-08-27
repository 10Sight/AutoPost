import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    generateText,
    generateImage,
    generateVideo,
    getJobStatus
} from "../controllers/ai.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";

const router = Router();

// Secure Per-User Rate Limiter for AI generation endpoints
// Caps user requests at 5 requests per minute to prevent spambots from draining monthly credits.
const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 5, // Max 5 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "You are generating AI content too quickly. Please wait a minute before trying again."
    }
});

// Protect all AI routes
router.use(verifyJWT);
router.use(tenantMiddleware);

// AI Generation Routes
router.post("/generate-text", aiLimiter, generateText);
router.post("/generate-image", aiLimiter, generateImage);
router.post("/generate-video", aiLimiter, generateVideo);

// Polling Job Status Route
router.get("/jobs/:jobId", getJobStatus);

export default router;
