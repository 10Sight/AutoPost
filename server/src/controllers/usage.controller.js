import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getOrCreateUsage } from "../services/usage.service.js";
import { Organization } from "../models/organization.model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * @desc    Get current organization usage and status
 * @route   GET /api/v1/usage/current
 * @access  Private (Authenticated via JWT)
 */
const getCurrentUsage = asyncHandler(async (req, res) => {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
        throw new ApiError(400, "Organization ID is required to fetch usage details.");
    }

    // 1. Fetch organization details for status and basics
    const organization = await Organization.findById(organizationId).select("name status active quota branding");
    
    if (!organization) {
        throw new ApiError(404, "Organization not found.");
    }

    // 2. Fetch or initialize real-time usage metrics
    const usage = await getOrCreateUsage(organizationId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                { 
                    organization, 
                    usage 
                }, 
                "Current usage metrics fetched successfully"
            )
        );
});

export {
    getCurrentUsage
};
