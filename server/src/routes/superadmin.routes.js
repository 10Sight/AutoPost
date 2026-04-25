import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import {
    getAllOrganizations,
    createOrganization,
    updateOrganizationStatus,
    updateOrganizationQuota,
    impersonateUser,
    getGlobalHealth,
    getGrowthAnalytics
} from "../controllers/superadmin.controller.js";

const router = Router();

// All routes require Superadmin role
router.use(verifyJWT, authorizeRoles("superadmin"));

router.route("/organizations")
    .get(getAllOrganizations)
    .post(createOrganization);

router.route("/organizations/:orgId/status").patch(updateOrganizationStatus);
router.route("/organizations/:orgId/quota").patch(updateOrganizationQuota);

router.route("/impersonate/:userId").post(impersonateUser);

router.route("/health").get(getGlobalHealth);
router.route("/analytics/growth").get(getGrowthAnalytics);

export default router;
