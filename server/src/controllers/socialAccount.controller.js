import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { validateLimit, updateUsage } from "../services/usage.service.js";

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

    // Check if account already exists for this organization and platform
    // If so, update it. If not, create it.
    const account = await SocialAccount.findOneAndUpdate(
        { organizationId: req.user.organizationId, platform },
        {
            userId: req.user._id, // Update the last user who connected it
            accessToken,
            refreshToken,
            expiresAt,
            platformUserId,
            platformUserName,
            metadata,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

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
    const { platform } = req.params;

    const result = await SocialAccount.findOneAndDelete({
        organizationId: req.user.organizationId,
        platform,
    });

    if (!result) {
        throw new ApiError(404, "Account not found");
    }

    // Usage Tracking: Decrement platform count
    await updateUsage(req.user.organizationId, 'platforms', 1, 'dec');

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Social account disconnected"));
});

export { getConnectedAccounts, connectAccount, disconnectAccount };
