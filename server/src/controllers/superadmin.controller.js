import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SuperadminService } from "../services/superadmin.service.js";
import { User } from "../models/user.model.js";

const getAllOrganizations = asyncHandler(async (req, res) => {
    const orgs = await SuperadminService.getAllOrganizations();
    return res.status(200).json(new ApiResponse(200, orgs, "Organizations fetched"));
});

const createOrganization = asyncHandler(async (req, res) => {
    const { companyName, adminName, adminEmail } = req.body;
    if (!companyName || !adminName || !adminEmail) {
        throw new ApiError(400, "Company Name, Admin Name, and Admin Email are required");
    }

    const result = await SuperadminService.provisionOrganization(
        { companyName, adminName, adminEmail },
        req.user._id
    );

    return res.status(201).json(new ApiResponse(201, result, "Organization provisioned and welcome email sent"));
});

const updateOrganizationStatus = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { status } = req.body;
    const org = await SuperadminService.updateOrganizationStatus(orgId, status);
    return res.status(200).json(new ApiResponse(200, org, `Organization status updated to ${status}`));
});

const updateOrganizationQuota = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { quota } = req.body;
    const org = await SuperadminService.updateOrganizationQuota(orgId, quota);
    return res.status(200).json(new ApiResponse(200, org, "Quotas updated successfully"));
});

const impersonateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await SuperadminService.prepareImpersonation(userId, req.user._id);
    
    // Generate tokens for the target user (same logic as login)
    const accessToken = user.generateAccessToken({ isImpersonated: true });
    const refreshToken = user.generateRefreshToken();

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user, accessToken }, `Successfully impersonating ${user.email}`));
});

const getGlobalHealth = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const health = await SuperadminService.getGlobalFailureFeed(parseInt(page), parseInt(limit));
    return res.status(200).json(new ApiResponse(200, health, "Global health data fetched"));
});

const getGrowthAnalytics = asyncHandler(async (req, res) => {
    const metrics = await SuperadminService.getGlobalGrowthMetrics();
    return res.status(200).json(new ApiResponse(200, metrics, "Growth analytics fetched"));
});

export {
    getAllOrganizations,
    createOrganization,
    updateOrganizationStatus,
    updateOrganizationQuota,
    impersonateUser,
    getGlobalHealth,
    getGrowthAnalytics
};
