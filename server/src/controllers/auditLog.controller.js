import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AuditLog } from "../models/auditLog.model.js";

const getAuditLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, action, entityType, userId, groupId } = req.query;
    
    // Security Fix: Always anchor query to the user's organization
    const query = { organizationId: req.user.organizationId };

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (userId) query.userId = userId;

    // Production-level group filtering
    if (groupId && groupId !== "all") {
        try {
            // Priority 1: Use direct groupId field (indexed for performance)
            query.groupId = groupId;
            
            // Priority 2: Fallback for older logs - also search for socialAccountId
            // if we are in a transition phase.
            const { AccountGroup } = await import("../models/accountGroup.model.js");
            const group = await AccountGroup.findOne({ _id: groupId, organizationId: req.user.organizationId });
            
            if (group && group.accounts && group.accounts.length > 0) {
                // This fallback captures both direct groupId matches OR socialAccountId matches
                query.$or = [
                    { groupId: groupId },
                    { socialAccountId: { $in: group.accounts } }
                ];
                delete query.groupId; // Handled in $or
            }
        } catch (err) {
            console.error(`Error applying audit group filter: ${err.message}`);
        }
    }

    const logs = await AuditLog.find(query)
        .populate("userId", "name email fullName") // Include name/fullName for initiator display
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
