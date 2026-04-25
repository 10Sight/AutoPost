import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import facebookService from "../services/facebook.service.js";
import { logger } from "../utils/logger.js";

/**
 * @desc    Generate Facebook/Instagram OAuth URL
 * @route   GET /api/v1/facebook/auth
 */
const getFacebookAuthUrl = asyncHandler(async (req, res) => {
    const state = req.user._id.toString();
    const url = await facebookService.getAuthUrl(state);

    return res
        .status(200)
        .json(new ApiResponse(200, { url }, "Facebook auth URL generated"));
});

/**
 * @desc    Handle Facebook OAuth callback
 * @route   GET /api/v1/facebook/callback
 */
const facebookCallback = asyncHandler(async (req, res) => {
    const { code, state, error, error_description } = req.query;

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (error) {
        logger.error(`[Facebook] OAuth Error: ${error} - ${error_description}`);
        return res.redirect(`${frontendUrl}/dashboard/settings?platform=facebook&status=error&message=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
        throw new ApiError(400, "Authorization code is required");
    }

    // 1. Exchange code for Short-Lived User Token
    const tokenData = await facebookService.exchangeCodeForToken(code);
    const shortLivedToken = tokenData.access_token;

    // 2. Upgrade to Long-Lived User Token (60 days)
    const longLivedData = await facebookService.getLongLivedToken(shortLivedToken);
    const longLivedToken = longLivedData.access_token;

    // 3. Discover Facebook Pages and Instagram Accounts
    const accounts = await facebookService.getManageableAccounts(longLivedToken);

    if (accounts.length === 0) {
        return res.redirect(`${frontendUrl}/dashboard/settings?platform=facebook&status=error&message=No manageable Facebook Pages or Instagram Business accounts found.`);
    }

    // 4. Redirect to selection UI on frontend
    // We pass the long-lived token and the discovered accounts
    const encodedAccounts = encodeURIComponent(JSON.stringify(accounts));
    return res.redirect(`${frontendUrl}/dashboard/settings?platform=facebook&status=select&accounts=${encodedAccounts}&token=${longLivedToken}`);
});

export {
    getFacebookAuthUrl,
    facebookCallback
};
