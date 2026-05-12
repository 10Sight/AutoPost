import { Router } from "express";
import { getOrganizationDetails, updateOrganizationBranding, getPublicBranding } from "../controllers/organization.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";

const router = Router();

// Public branding route (No JWT required, tenant context optional)
router.get("/public", (req, res, next) => {
    // We call it but don't throw an error if it fails
    tenantMiddleware(req, res, () => next()).catch(() => next());
}, getPublicBranding);

// Protected routes (JWT required)
router.use(verifyJWT);
router.use(tenantMiddleware);

router.route("/").get(getOrganizationDetails).patch(updateOrganizationBranding);

export default router;
