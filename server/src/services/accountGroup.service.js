import { AccountGroup } from "../models/accountGroup.model.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";

class AccountGroupService {
    /**
     * Create a new account group (company/brand)
     */
    async createGroup(data) {
        const { name, description, organizationId, createdBy } = data;

        if (!name || !organizationId) {
            throw new ApiError(400, "Group name and organization ID are required");
        }

        // Check if group with same name already exists in this organization
        const existingGroup = await AccountGroup.findOne({ name, organizationId });
        if (existingGroup) {
            throw new ApiError(400, `An account group with the name "${name}" already exists.`);
        }

        try {
            const group = await AccountGroup.create({
                name,
                description,
                organizationId,
                createdBy,
            });

            logger.info(`Account group created: ${group.name} (Org: ${organizationId})`);
            return group;
        } catch (error) {
            logger.error(`Error creating account group: ${error.message}`);
            throw new ApiError(500, "Failed to create account group");
        }
    }

    /**
     * Get all groups for an organization with populated accounts
     */
    async getGroupsByOrg(organizationId) {
        if (!organizationId) {
            throw new ApiError(400, "Organization ID is required");
        }

        return await AccountGroup.find({ organizationId })
            .populate("accounts")
            .sort({ name: 1 });
    }

    /**
     * Update group details or account list
     */
    async updateGroup(groupId, organizationId, updateData) {
        const group = await AccountGroup.findOne({ _id: groupId, organizationId });
        if (!group) {
            throw new ApiError(404, "Account group not found");
        }

        // If name is being changed, check for duplicates
        if (updateData.name && updateData.name !== group.name) {
            const existingName = await AccountGroup.findOne({
                name: updateData.name,
                organizationId,
                _id: { $ne: groupId }
            });
            if (existingName) {
                throw new ApiError(400, "Another group with this name already exists");
            }
        }

        // Apply updates
        if (updateData.name) group.name = updateData.name;
        if (updateData.description !== undefined) group.description = updateData.description;
        if (updateData.accounts) group.accounts = updateData.accounts;

        try {
            await group.save();
            logger.info(`Account group updated: ${group._id}`);
            return group;
        } catch (error) {
            logger.error(`Error updating account group: ${error.message}`);
            throw new ApiError(500, "Failed to update account group");
        }
    }

    /**
     * Add an account to a group (and remove it from any other group if 1:1 is desired)
     * Here we treat groups as a way to organize accounts. 
     * We'll ensure an account is in only one group at a time for this implementation.
     */
    async addAccountToGroup(groupId, accountId, organizationId) {
        // Validation
        if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(accountId)) {
            throw new ApiError(400, "Invalid group or account ID");
        }

        // 1. Remove account from all other groups in this organization (to maintain 1:1 grouping)
        await AccountGroup.updateMany(
            { organizationId, accounts: accountId },
            { $pull: { accounts: accountId } }
        );

        // 2. Add to the target group
        if (groupId !== "none") { // "none" can be used to just ungroup an account
            const group = await AccountGroup.findOneAndUpdate(
                { _id: groupId, organizationId },
                { $addToSet: { accounts: accountId } },
                { new: true }
            );

            if (!group) {
                throw new ApiError(404, "Target account group not found");
            }
            return group;
        }

        return null;
    }

    /**
     * Delete a group
     */
    async deleteGroup(groupId, organizationId) {
        const result = await AccountGroup.deleteOne({ _id: groupId, organizationId });
        if (result.deletedCount === 0) {
            throw new ApiError(404, "Account group not found");
        }
        logger.info(`Account group deleted: ${groupId}`);
        return true;
    }
}

export const accountGroupService = new AccountGroupService();
