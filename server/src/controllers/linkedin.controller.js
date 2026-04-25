import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import linkedinService from "../services/linkedin.service.js";

/**
 * @desc    Generate LinkedIn OAuth URL
 * @route   GET /api/v1/linkedin/auth
 */
const getLinkedInAuthUrl = asyncHandler(async (req, res) => {
    // Business logic is inside the service
    const url = linkedinService.getAuthUrl(req.user._id.toString());

    return res
        .status(200)
        .json(new ApiResponse(200, { url }, "LinkedIn auth URL generated"));
});

/**
 * @desc    Handle LinkedIn OAuth callback
 * @route   GET /api/v1/linkedin/callback
 */
const linkedinCallback = asyncHandler(async (req, res) => {
    const { code, state, error, error_description } = req.query;

    if (error) {
        logger.error(`[LinkedIn] Callback Error: ${error} - ${error_description}`);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/dashboard/settings?platform=linkedin&status=error&message=${error_description || error}`);
    }

    if (!code) {
        logger.warn(`[LinkedIn] Callback received without code. Query:`, req.query);
        throw new ApiError(400, "Authorization code is required");
    }

    // State was our User ID
    if (state !== req.user?._id?.toString() && state !== req.query.state) {
        // In some flows verifyJWT might not be active yet depending on how we mount the route
        // But here we expect it.
    }

    // 1. Exchange code for token
    const tokenData = await linkedinService.exchangeCodeForToken(code);
    const accessToken = tokenData.access_token;

    // 2. Fetch Profile and Pages
    const profile = await linkedinService.getProfileInfo(accessToken);
    const manageablePages = await linkedinService.getManageablePages(accessToken);

    const selectableAccounts = [
        {
            id: profile.id,
            name: `${profile.name} (Personal Profile)`,
            thumbnail: profile.picture,
            platform: "linkedin",
            isPage: false
        },
        ...manageablePages.map(page => ({
            ...page,
            platform: "linkedin",
            isPage: true
        }))
    ];

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // 3. Always show selection UI if there are pages available (Professional Standard)
    if (manageablePages.length >= 1) {
        const encodedPages = encodeURIComponent(JSON.stringify(selectableAccounts));
        return res.redirect(`${frontendUrl}/dashboard/settings?platform=linkedin&status=select&pages=${encodedPages}&token=${accessToken}`);
    }

    // 4. Default to personal profile if no pages exist
    const target = profile;
    const stats = await linkedinService.getProfileStats(accessToken, target.id);

    const account = await SocialAccount.findOneAndUpdate(
        { organizationId: req.user.organizationId, platform: "linkedin", platformUserId: target.id },
        {
            userId: req.user._id,
            accessToken,
            expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
            platformUserId: target.id,
            platformUserName: target.name,
            metadata: {
                thumbnail: target.thumbnail || profile.picture,
                isPage: false,
                personalProfile: profile,
                statistics: stats,
            },
        },
        { new: true, upsert: true }
    );

    return res.redirect(`${frontendUrl}/dashboard/settings?platform=linkedin&status=success`);
});

export {
    getLinkedInAuthUrl,
    linkedinCallback
};
