import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Organization } from "../models/organization.model.js";

/**
 * Middleware to enforce tenant (Organization) isolation.
 * Resolves organization context via multiple strategies:
 * 1. Authenticated User (req.user.organizationId)
 * 2. Public Identifier (x-tenant-slug header or query param)
 * 3. Development Fallback (First organization found)
 */
export const tenantMiddleware = asyncHandler(async (req, res, next) => {
    let organization = null;

    // Strategy 1: User Session (Highest priority)
    if (req.user?.organizationId) {
        organization = await Organization.findById(req.user.organizationId);
    } 

    // Strategy 2: Public Identifier (Header or Query)
    if (!organization) {
        const slug = req.headers["x-tenant-slug"] || req.query.tenantSlug;
        if (slug) {
            organization = await Organization.findOne({ slug });
        }
    }

    // Strategy 3: Development Fallback (Only in non-production)
    if (!organization && process.env.NODE_ENV !== "production") {
        organization = await Organization.findOne(); // Fallback to first org for dev convenience
    }

    // Validation: If no organization could be resolved by ANY strategy
    if (!organization) {
        // If the user was supposed to be logged in (req.user exists but org is gone)
        if (req.user) {
            throw new ApiError(401, "Your organization context is missing or invalid. Please re-login.");
        }
        // Otherwise, it's a generic identification failure
        throw new ApiError(404, "Workspace not found. Please check your URL or organization ID.");
    }

    // Isolation: Block access for non-active organizations (unless superadmin)
    if (organization.status !== "active" && req.user?.role !== "superadmin") {
        throw new ApiError(403, `This workspace is currently ${organization.status}. Please contact support.`);
    }

    // Attachment: Inject context into the request object for controllers
    req.organizationId = organization._id;
    req.organization = organization;
    
    // Support for Superadmin "Targeting"
    if (req.user?.role === "superadmin") {
        const targetOrgId = req.headers["x-tenant-id"] || req.query.targetOrgId;
        if (targetOrgId) {
            const targetOrg = await Organization.findById(targetOrgId);
            if (targetOrg) {
                req.organizationId = targetOrg._id;
                req.organization = targetOrg;
            }
        }
    }

    next();
});
