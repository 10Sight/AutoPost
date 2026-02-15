import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to enforce tenant (Organization) isolation.
 * Assumes authMiddleware has already run and populated req.user.
 */
export const tenantMiddleware = asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.organizationId) {
        throw new ApiError(401, "Unauthorized: Organization context missing. Please log in again.");
    }

    // Attach organizationId to req for easy access in controllers
    req.organizationId = req.user.organizationId;

    next();
});
