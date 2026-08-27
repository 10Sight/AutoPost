import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Organization } from "../models/organization.model.js";
import { logger } from "../utils/logger.js";
import {
    generateGeminiAuthUrl,
    exchangeGeminiCodeForTokens,
    fetchGoogleUserEmail,
} from "../services/googleOAuth.service.js";

const FRONTEND_SETTINGS_URL = () => `${process.env.FRONTEND_URL || "http://localhost:5173"}/organization-settings?tab=ai`;

/**
 * @desc    Generate the "Connect Google Account" consent URL for Gemini
 * @route   GET /api/v1/organization/oauth/gemini/auth
 */
const initiateGeminiOAuth = asyncHandler(async (req, res) => {
    // State is the requesting user's id, verified against the session on callback —
    // same CSRF-defense pattern already used by the YouTube OAuth flow.
    const state = req.user._id.toString();
    const url = generateGeminiAuthUrl(state);

    return res
        .status(200)
        .json(new ApiResponse(200, { url }, "Google OAuth URL generated"));
});

/**
 * @desc    Handle the Google OAuth redirect, store encrypted tokens on the org
 * @route   GET /api/v1/organization/oauth/gemini/callback
 */
const geminiOAuthCallback = asyncHandler(async (req, res) => {
    const { code, state, error: oauthError } = req.query;
    const redirectBase = FRONTEND_SETTINGS_URL();

    if (oauthError) {
        logger.warn(`[Gemini OAuth] Google returned an error: ${oauthError}`);
        return res.redirect(`${redirectBase}&oauth=error&reason=denied`);
    }

    if (!code || state !== req.user._id.toString()) {
        return res.redirect(`${redirectBase}&oauth=error&reason=invalid_state`);
    }

    try {
        const tokens = await exchangeGeminiCodeForTokens(code);

        if (!tokens.refresh_token) {
            // Google only issues a refresh token on the first consent (or when
            // prompt=consent forces re-issue, which we always request) — if it's
            // still missing, the exchange itself is unusable for rotation.
            logger.error(`[Gemini OAuth] No refresh token returned for org: ${req.user.organizationId}`);
            return res.redirect(`${redirectBase}&oauth=error&reason=no_refresh_token`);
        }

        const email = await fetchGoogleUserEmail(tokens.access_token);

        const organization = await Organization.findById(req.user.organizationId)
            .select("+aiOAuth.gemini.accessToken +aiOAuth.gemini.refreshToken +aiOAuth.gemini.expiryDate");

        if (!organization) {
            throw new ApiError(404, "Organization not found");
        }

        if (!organization.aiOAuth) organization.aiOAuth = {};
        organization.aiOAuth.gemini = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            connectedEmail: email,
            connectedAt: new Date(),
            // Preserve a previously-set project id across reconnects
            projectId: organization.aiOAuth?.gemini?.projectId || "",
        };
        organization.markModified("aiOAuth");
        await organization.save();

        logger.info(`[Gemini OAuth] Connected Google account (${email}) for org: ${req.user.organizationId}`);
        return res.redirect(`${redirectBase}&oauth=success`);
    } catch (error) {
        logger.error(`[Gemini OAuth] Callback failed for org: ${req.user.organizationId}`, error.message);
        return res.redirect(`${redirectBase}&oauth=error&reason=exchange_failed`);
    }
});

/**
 * @desc    Disconnect the Gemini Google OAuth connection
 * @route   POST /api/v1/organization/oauth/gemini/disconnect
 */
const disconnectGeminiOAuth = asyncHandler(async (req, res) => {
    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    organization.aiOAuth = { gemini: undefined };
    organization.markModified("aiOAuth");
    await organization.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Google account disconnected successfully"));
});

/**
 * @desc    Set the GCP project id billed for OAuth-authenticated Gemini calls
 * @route   PUT /api/v1/organization/oauth/gemini/project
 */
const updateGeminiProjectId = asyncHandler(async (req, res) => {
    const { projectId } = req.body;

    if (typeof projectId !== "string") {
        throw new ApiError(400, "projectId is required");
    }

    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    if (!organization.aiOAuth?.gemini) {
        throw new ApiError(400, "Connect a Google account before setting a project id");
    }

    organization.aiOAuth.gemini.projectId = projectId.trim();
    organization.markModified("aiOAuth");
    await organization.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { projectId: organization.aiOAuth.gemini.projectId }, "Project id updated successfully"));
});

export {
    initiateGeminiOAuth,
    geminiOAuthCallback,
    disconnectGeminiOAuth,
    updateGeminiProjectId,
};
