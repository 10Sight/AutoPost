import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Organization } from "../models/organization.model.js";
import { ApiError } from "../utils/ApiError.js";

const getOrganizationDetails = asyncHandler(async (req, res) => {
    const organization = await Organization.findById(req.user.organizationId);

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, organization, "Organization details fetched successfully"));
    Base - Update - Org - Settings - Here
});

const updateOrganizationBranding = asyncHandler(async (req, res) => {
    const { name, branding } = req.body;

    const organization = await Organization.findByIdAndUpdate(
        req.user.organizationId,
        {
            $set: {
                name,
                branding,
            }
        },
        { new: true }
    );

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, organization, "Organization branding updated successfully"));
});

const getPublicBranding = asyncHandler(async (req, res) => {
    // req.organization is populated by tenantMiddleware
    const organization = req.organization;

    if (!organization) {
        throw new ApiError(404, "Organization not found in this context");
    }

    // Return ONLY public branding data
    const publicData = {
        name: organization.name,
        branding: organization.branding || {}
    };

    return res
        .status(200)
        .json(new ApiResponse(200, publicData, "Public branding fetched successfully"));
});

export { 
    getOrganizationDetails, 
    updateOrganizationBranding,
    getPublicBranding
};
