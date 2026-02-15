import { Router } from "express";
import {
    getYouTubeAuthUrl,
    youtubeCallback,
    getChannelInfo,
    disconnectChannel,
    validateVideo,
    scheduleYouTubePost,
    getYouTubeQuotaMetrics,
    getYouTubeAnalytics
} from "../controllers/youtube.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

// Publicly accessible for Google redirect (state parameter handles security)
router.route("/auth").get(verifyJWT, getYouTubeAuthUrl);
router.route("/callback").get(verifyJWT, youtubeCallback);

// Protected routes
router.use(verifyJWT);
router.use(tenantMiddleware);

router.route("/channel")
    .get(getChannelInfo)
    .delete(disconnectChannel);

router.route("/validate").post(validateVideo);
router.route("/schedule").post(scheduleYouTubePost);
router.route("/quota-metrics").get(getYouTubeQuotaMetrics);
router.route("/analytics").get(getYouTubeAnalytics);

export default router;
