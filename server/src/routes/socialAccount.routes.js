import { Router } from "express";
import {
    getConnectedAccounts,
    connectAccount,
    disconnectAccount,
} from "../controllers/socialAccount.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT to all routes

router.route("/").get(getConnectedAccounts).post(connectAccount);
router.post("/connect", connectAccount); // Explicit route for frontend compatibility
router.route("/:platform").delete(disconnectAccount);

export default router;
