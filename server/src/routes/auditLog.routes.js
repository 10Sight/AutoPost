import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAuditLogs } from "../controllers/auditLog.controller.js";

const router = Router();

router.use(verifyJWT);

// In a real app, you'd likely add an 'isAdmin' middleware here
router.route("/").get(getAuditLogs);

export default router;
