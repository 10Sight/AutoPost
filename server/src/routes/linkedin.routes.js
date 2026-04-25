import { Router } from "express";
import {
    getLinkedInAuthUrl,
    linkedinCallback
} from "../controllers/linkedin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Endpoint to get the Auth URL
router.route("/auth").get(verifyJWT, getLinkedInAuthUrl);

// Endpoint for LinkedIn callback
router.route("/callback").get(verifyJWT, linkedinCallback);

export default router;
