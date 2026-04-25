import { Router } from "express";
import {
    getFacebookAuthUrl,
    facebookCallback
} from "../controllers/facebook.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Auth generation needs to know the user
router.get("/auth", verifyJWT, getFacebookAuthUrl);

// Callback is a redirect from Meta
// Note: We might need a generic route if Meta stripping headers, 
// but usually standard OAuth callback is fine.
router.get("/callback", facebookCallback);

export default router;
