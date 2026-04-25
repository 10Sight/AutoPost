import { accountGroupService } from "../services/accountGroup.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * @desc Get all account groups for the current organization
 * @route GET /api/v1/account-groups
 * @access Private
 */
export const getGroups = asyncHandler(async (req, res) => {
    const organizationId = req.user.organizationId;
    const groups = await accountGroupService.getGroupsByOrg(organizationId);

    return res.status(200).json(
        new ApiResponse(200, groups, "Account groups retrieved successfully")
    );
});

/**
 * @desc Create a new account group
 * @route POST /api/v1/account-groups
 * @access Private
 */
export const createGroup = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user._id;

    if (!name) {
        throw new ApiError(400, "Group name is required");
    }

    const group = await accountGroupService.createGroup({
        name,
        description,
        organizationId,
        createdBy: userId
    });

    return res.status(201).json(
        new ApiResponse(201, group, "Account group created successfully")
    );
});

/**
 * @desc Update an existing account group
 * @route PATCH /api/v1/account-groups/:groupId
 * @access Private
 */
export const updateGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const organizationId = req.user.organizationId;
    
    const group = await accountGroupService.updateGroup(groupId, organizationId, req.body);

    return res.status(200).json(
        new ApiResponse(200, group, "Account group updated successfully")
    );
});

/**
 * @desc Add or move an account to a group
 * @route POST /api/v1/account-groups/:groupId/accounts
 * @access Private
 */
export const assignAccountToGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { accountId } = req.body;
    const organizationId = req.user.organizationId;

    if (!accountId) {
        throw new ApiError(400, "Account ID is required");
    }

    await accountGroupService.addAccountToGroup(groupId, accountId, organizationId);

    return res.status(200).json(
        new ApiResponse(200, null, "Account assignment updated successfully")
    );
});

/**
 * @desc Delete an account group
 * @route DELETE /api/v1/account-groups/:groupId
 * @access Private
 */
export const deleteGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const organizationId = req.user.organizationId;

    await accountGroupService.deleteGroup(groupId, organizationId);

    return res.status(200).json(
        new ApiResponse(200, null, "Account group deleted successfully")
    );
});
