import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import xService from "../services/x.service.js";
import { logger } from "../utils/logger.js";

/**
 * @desc    Generate X OAuth URL
 * @route   GET /api/v1/x/auth
 */
const getXAuthUrl = asyncHandler(async (req, res) => {
    const { url, codeVerifier, state } = xService.getAuthUrl();

    // Store codeVerifier in httpOnly cookie to be used in callback
    res.cookie("codeVerifier", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 15, // 15 mins
    });

    res.cookie("oauthState", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 15,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { url }, "X auth URL generated"));
});

/**
 * @desc    Handle X OAuth callback
 * @route   GET /api/v1/x/callback
 */
const xCallback = asyncHandler(async (req, res) => {
    const { code, state, error } = req.query;
    const { codeVerifier, oauthState } = req.cookies;
    
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (error) {
        logger.error(`[X] Callback Error: ${error}`);
        return res.redirect(`${frontendUrl}/dashboard/settings?platform=x&status=error&message=${error}`);
    }

    if (!code || !state || !codeVerifier || !oauthState) {
        logger.error("[X] Missing callback parameters or expired session");
        return res.redirect(`${frontendUrl}/dashboard/settings?platform=x&status=error&message=session_expired`);
    }

    if (state !== oauthState) {
        logger.error("[X] Invalid state");
        return res.redirect(`${frontendUrl}/dashboard/settings?platform=x&status=error&message=invalid_state`);
    }

    // Exchange code for token
    const tokenData = await xService.exchangeCodeForToken(code, codeVerifier);

    // Clear cookies
    res.clearCookie("codeVerifier");
    res.clearCookie("oauthState");

    const account = await SocialAccount.findOneAndUpdate(
        { organizationId: req.user.organizationId, platform: "x", platformUserId: tokenData.user.id },
        {
            userId: req.user._id,
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresAt: tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000) : null,
            platformUserId: tokenData.user.id,
            platformUserName: tokenData.user.username,
            metadata: {
                thumbnail: tokenData.user.profile_image_url,
                ...tokenData.user,
            },
        },
        { new: true, upsert: true }
    );

    // Emit Audit Event
    const { eventBus } = await import("../utils/eventBus.js");
    const { EVENTS } = await import("../events/events.js");

    eventBus.emit(EVENTS.X_ACCOUNT_CONNECTED, {
        userId: req.user._id,
        organizationId: req.user.organizationId,
        accountId: account._id,
        platform: "x",
        username: tokenData.user.username
    });

    return res.redirect(`${frontendUrl}/dashboard/settings?platform=x&status=success`);
});

/**
 * @desc    Get connected X account info
 * @route   GET /api/v1/x/channel
 */
const getChannelInfo = asyncHandler(async (req, res) => {
    const account = await SocialAccount.findOne({
        organizationId: req.user.organizationId,
        platform: "x",
    });

    if (!account) {
        throw new ApiError(404, "X account not connected");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, account, "Account info fetched successfully"));
});

/**
 * @desc    Disconnect X account
 * @route   DELETE /api/v1/x/channel
 */
const disconnectChannel = asyncHandler(async (req, res) => {
    const result = await SocialAccount.findOneAndDelete({
        organizationId: req.user.organizationId,
        platform: "x",
    });

    if (!result) {
        throw new ApiError(404, "X account not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "X account disconnected successfully"));
});

export {
    getXAuthUrl,
    xCallback,
    getChannelInfo,
    disconnectChannel
};
