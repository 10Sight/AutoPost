import { Router } from "express";
import { 
    sendInvitation, 
    verifyInvitation, 
    getPendingInvitations, 
    cancelInvitation 
} from "../controllers/invitation.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";

const router = Router();

// Public route to verify invitation before signup
router.route("/verify/:token").get(verifyInvitation);

// Secured routes
router.use(verifyJWT);
router.use(tenantMiddleware);

router.route("/")
    .get(authorizeRoles("admin", "superadmin"), getPendingInvitations)
    .post(authorizeRoles("admin", "superadmin"), sendInvitation);

router.route("/:inviteId")
    .delete(authorizeRoles("admin", "superadmin"), cancelInvitation);

export default router;
