import { Usage } from "../models/usage.model.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { Organization } from "../models/organization.model.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

/**
 * Service to manage usage tracking logic
 */
export const getOrCreateUsage = async (organizationId) => {
    let usage = await Usage.findOne({ organizationId });

    // Self-Healing: Resync platforms count to fix drift issues (e.g. negative values)
    const actualPlatformsCount = await SocialAccount.countDocuments({ organizationId });
    const needsPlatformsResync = !usage || usage.platformsUsed !== actualPlatformsCount;

    if (!usage) {
        // Pull limits from organization master record
        const org = await Organization.findById(organizationId);
        
        usage = await Usage.create({ 
            organizationId,
            postsLimit: org?.quota?.maxPostsPerMonth || 100,
            platformsLimit: org?.quota?.maxAccounts || 5,
            platformsUsed: actualPlatformsCount, // Use real count on creation
            storageLimitBytes: (org?.quota?.storageLimitGB || 1) * 1024 * 1024 * 1024
        });
    } else if (needsPlatformsResync) {
        usage.platformsUsed = actualPlatformsCount;
        await usage.save();
        logger.info(`[Usage] Resynced platforms count for Organization: ${organizationId}. New count: ${actualPlatformsCount}`);
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
        logger.info(`[Usage] Monthly cycle reset for Organization: ${organizationId}`);
    }

    // YouTube Daily Quota Reset
    // If no last reset date exists, we default to epoch (1970) to force a reset on first run
    const lastYoutubeReset = usage.lastYoutubeQuotaReset ? new Date(usage.lastYoutubeQuotaReset) : new Date(0);
    
    if (
        now.getUTCDate() !== lastYoutubeReset.getUTCDate() ||
        now.getUTCMonth() !== lastYoutubeReset.getUTCMonth() ||
        now.getUTCFullYear() !== lastYoutubeReset.getUTCFullYear()
    ) {
        const previousUsed = usage.youtubeQuotaUsed;
        usage.youtubeQuotaUsed = 0;
        usage.lastYoutubeQuotaReset = now;
        await usage.save();
        
        if (previousUsed > 0) {
            logger.info(`[Usage] Daily YouTube quota reset for Organization: ${organizationId}. (Cleared: ${previousUsed} units)`);
        }
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

    const result = await Usage.findOneAndUpdate(
        { organizationId },
        { $inc: { [field]: op } },
        { new: true, upsert: true }
    );

    // Production Guardrail: Ensure counters never drop below zero
    if (result && result[field] < 0) {
        result[field] = 0;
        await result.save();
        logger.warn(`[Usage] Corrected negative value for ${field} in Organization: ${organizationId}`);
    }

    return result;
};
