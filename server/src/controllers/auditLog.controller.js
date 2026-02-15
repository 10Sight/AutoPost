import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AuditLog } from "../models/auditLog.model.js";

const getAuditLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, action, entityType, userId } = req.query;
    const query = {};

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (userId) query.userId = userId;

    const logs = await AuditLog.find(query)
        .populate("userId", "fullName email")
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
            "Audit logs fetched successfully"
        )
    );
});

export { getAuditLogs };
