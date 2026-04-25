import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { validateLimit, updateUsage } from "../services/usage.service.js";
import facebookService from "../services/facebook.service.js";
import linkedinService from "../services/linkedin.service.js";
import xService from "../services/x.service.js";

const getConnectedAccounts = asyncHandler(async (req, res) => {
    const accounts = await SocialAccount.find({ organizationId: req.user.organizationId });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                accounts,
                "Connected accounts fetched successfully"
            )
        );
});

const connectAccount = asyncHandler(async (req, res) => {
    const {
        platform,
        accessToken,
        refreshToken,
        expiresIn,
        platformUserId,
        platformUserName,
        thumbnail,
        avatar,
        picture,
        metadata,
    } = req.body;

    if (!platform || !accessToken) {
        throw new ApiError(400, "Platform and Access Token are required");
    }

    const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null;

    // Usage Tracking: Validate platform limit before connecting a NEW account
    const existingAccount = await SocialAccount.findOne({ organizationId: req.user.organizationId, platform });
    if (!existingAccount) {
        await validateLimit(req.user.organizationId, 'platforms');
    }

    // Fetch real-time stats based on platform
    let updatedMetadata = { ...metadata };
    try {
        if (platform === "facebook" || platform === "instagram") {
            updatedMetadata.statistics = await facebookService.getProfileStats(accessToken, platformUserId, platform);
        } else if (platform === "linkedin") {
            updatedMetadata.statistics = await linkedinService.getProfileStats(accessToken, platformUserId);
        } else if (platform === "x") {
            updatedMetadata.statistics = await xService.getProfileStats(accessToken);
        }
    } catch (error) {
        logger.error(`[SocialAccount] Failed to fetch stats for ${platform}: ${error.message}`);
        // Continue without stats rather than failing the whole connection
    }

    // Check if account already exists for this organization, platform, and specific User ID
    // This allows connecting both a Personal Profile and a Page on the same platform
    const account = await SocialAccount.findOneAndUpdate(
        { organizationId: req.user.organizationId, platform, platformUserId },
        {
            userId: req.user._id, // Update the last user who connected it
            accessToken,
            refreshToken,
            expiresAt,
            platformUserId,
            platformUserName,
            thumbnail: thumbnail || avatar || picture,
            avatar: avatar || thumbnail || picture,
            picture: picture || thumbnail || avatar,
            metadata: updatedMetadata,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // [PRODUCTION] Clean Adoption: Re-link orphaned posts to this account
    // This handles cases where a user disconnected and reconnected the SAME social entity.
    try {
        const { ScheduledPost } = await import("../models/scheduledPost.model.js");
        const updateResult = await ScheduledPost.updateMany(
            { 
                organizationId: req.user.organizationId, 
                platform: platform,
                platformUserId: platformUserId, // Perfect Match: only adopt if it's the exact same page/user
                $or: [
                    { socialAccountId: { $exists: false } },
                    { socialAccountId: null }
                ]
            },
            { $set: { socialAccountId: account._id } }
        );
        
        if (updateResult.modifiedCount > 0) {
            console.log(`[RECOVERY] Adopted ${updateResult.modifiedCount} orphaned posts for platform=${platform}, userId=${platformUserId}`);
        }
    } catch (error) {
        // Log but don't fail the connection if adoption fails
        console.error(`[RECOVERY] Failed to adopt orphaned posts:`, error.message);
    }

    // Usage Tracking: Increment platform count if it was a new connection
    if (!existingAccount) {
        await updateUsage(req.user.organizationId, 'platforms', 1, 'inc');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, account, "Social account connected successfully")
        );
});

const disconnectAccount = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await SocialAccount.findOneAndDelete({
        organizationId: req.user.organizationId,
        _id: id,
    });

    if (!result) {
        throw new ApiError(404, "Account not found or access denied");
    }

    // Usage Tracking: Decrement platform count
    await updateUsage(req.user.organizationId, 'platforms', 1, 'dec');

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Social account disconnected successfully"));
});

export { getConnectedAccounts, connectAccount, disconnectAccount };
