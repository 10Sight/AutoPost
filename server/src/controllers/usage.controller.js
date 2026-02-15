import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getOrCreateUsage } from "../services/usage.service.js";

const getUsage = asyncHandler(async (req, res) => {
    const usage = await getOrCreateUsage(req.user.organizationId);

    return res
        .status(200)
        .json(new ApiResponse(200, usage, "Usage metrics fetched successfully"));
});

export { getUsage };
