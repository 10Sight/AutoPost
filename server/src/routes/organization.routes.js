import { Router } from "express";
import { getOrganizationDetails, updateOrganizationBranding } from "../controllers/organization.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";

const router = Router();

router.use(verifyJWT);
router.use(tenantMiddleware);

router.route("/").get(getOrganizationDetails).patch(updateOrganizationBranding);

export default router;
