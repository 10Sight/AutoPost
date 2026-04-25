import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";
import { getCurrentUsage } from "../controllers/usage.controller.js";

const router = Router();

// Secure all usage routes
router.use(verifyJWT);
router.use(tenantMiddleware);

router.route("/current").get(getCurrentUsage);

export default router;
