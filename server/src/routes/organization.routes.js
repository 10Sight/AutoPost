import { Router } from "express";
import { getOrganizationDetails, updateOrganizationBranding, getPublicBranding } from "../controllers/organization.controller.js";
import { getAiKeys, updateAiKeys } from "../controllers/aiSettings.controller.js";
import {
    initiateGeminiOAuth,
    geminiOAuthCallback,
    disconnectGeminiOAuth,
    updateGeminiProjectId,
} from "../controllers/oauth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

// Public branding route (No JWT required)
router.get("/public", getPublicBranding);

// Protected routes (JWT required)
router.use(verifyJWT);
router.use(tenantMiddleware);

router.route("/").get(getOrganizationDetails).patch(updateOrganizationBranding);

// BYOK AI provider keys — admin-only, never returns raw key values (see aiSettings.controller.js)
router.route("/ai-keys")
    .get(authorizeRoles("admin"), getAiKeys)
    .put(authorizeRoles("admin"), updateAiKeys);

// "Connect Google Account" OAuth flow for Gemini — see oauth.controller.js.
// The callback has no authorizeRoles guard: it's reached by the browser following
// Google's redirect in the same session that started the flow, and the state
// parameter (checked inside the handler) is the CSRF/identity guard, not the role.
router.route("/oauth/gemini/auth").get(authorizeRoles("admin"), initiateGeminiOAuth);
router.route("/oauth/gemini/callback").get(geminiOAuthCallback);
router.route("/oauth/gemini/disconnect").post(authorizeRoles("admin"), disconnectGeminiOAuth);
router.route("/oauth/gemini/project").put(authorizeRoles("admin"), updateGeminiProjectId);

export default router;
