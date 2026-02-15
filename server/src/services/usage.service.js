import { Usage } from "../models/usage.model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Service to manage usage tracking logic
 */
export const getOrCreateUsage = async (organizationId) => {
    let usage = await Usage.findOne({ organizationId });

    if (!usage) {
        usage = await Usage.create({ organizationId });
    }

    // Check for cycle reset
    const now = new Date();
    if (now > usage.cycleEnd) {
        usage.cycleStart = usage.cycleEnd;
        const nextEnd = new Date(usage.cycleEnd);
        usage.cycleEnd = new Date(nextEnd.setMonth(nextEnd.getMonth() + 1));

        // Reset monthly metrics
        usage.postsUsed = 0;
        await usage.save();
    }

    return usage;
};

/**
 * Validates if an action would exceed limits
 */
export const validateLimit = async (organizationId, metric, amount = 1) => {
    const usage = await getOrCreateUsage(organizationId);

    switch (metric) {
        case 'posts':
            if (usage.postsUsed + amount > usage.postsLimit) {
                throw new ApiError(403, "Monthly post limit reached for your organization. Please upgrade your plan.");
            }
            break;
        case 'platforms':
            if (usage.platformsUsed + amount > usage.platformsLimit) {
                throw new ApiError(403, "Platform connection limit reached for your organization. Please upgrade your plan.");
            }
            break;
        case 'storage':
            if (usage.storageUsedBytes + amount > usage.storageLimitBytes) {
                throw new ApiError(403, "Storage limit reached for your organization. Please delete some media or upgrade.");
            }
            break;
        case 'team':
            if (usage.teamUsed + amount > usage.teamLimit) {
                throw new ApiError(403, "Team member limit reached for your organization. Please upgrade your plan.");
            }
            break;
        default:
            break;
    }

    return usage;
};

/**
 * Increments or decrements usage metrics
 */
export const updateUsage = async (organizationId, metric, amount = 1, type = 'inc') => {
    const field = metric === 'posts' ? 'postsUsed'
        : metric === 'platforms' ? 'platformsUsed'
            : metric === 'storage' ? 'storageUsedBytes'
                : metric === 'team' ? 'teamUsed' : null;

    if (!field) return;

    const op = type === 'inc' ? amount : -amount;

    return await Usage.findOneAndUpdate(
        { organizationId },
        { $inc: { [field]: op } },
        { new: true, upsert: true }
    );
};
