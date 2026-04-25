import { Router } from "express";
import {
    getXAuthUrl,
    xCallback,
    getChannelInfo,
    disconnectChannel
} from "../controllers/x.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";

const router = Router();

// Publicly accessible for X redirect
router.route("/auth").get(verifyJWT, getXAuthUrl);
router.route("/callback").get(verifyJWT, xCallback);

// Protected routes
router.use(verifyJWT);
router.use(tenantMiddleware);

router.route("/channel")
    .get(getChannelInfo)
    .delete(disconnectChannel);

export default router;
