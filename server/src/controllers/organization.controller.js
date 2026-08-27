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
    // Manually resolve organization since we removed tenantMiddleware from this public route
    let organization = null;
    const slug = req.headers["x-tenant-slug"] || req.query.tenantSlug;
    
    if (slug) {
        organization = await Organization.findOne({ slug });
    }

    // If no specific organization context, return default app branding
    if (!organization) {
        return res.status(200).json(new ApiResponse(200, {
            name: "Auto Posting",
            branding: {
                primaryColor: "#2563eb",
                logo: ""
            }
        }, "Default branding returned"));
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
