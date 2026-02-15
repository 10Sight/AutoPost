import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authorizeRoles = (...allowedRoles) => {
    return asyncHandler(async (req, _, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new ApiError(403, "Access denied. You do not have permission to perform this action.");
        }
        next();
    });
};
