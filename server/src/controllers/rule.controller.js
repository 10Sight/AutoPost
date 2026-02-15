import { asyncHandler } from "../utils/asyncHandler.js";
import { Rule } from "../models/rule.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getRules = asyncHandler(async (req, res) => {
    const rules = await Rule.find({ organizationId: req.user.organizationId }).sort({ priority: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, rules, "Rules fetched successfully"));
});

export { getRules };
