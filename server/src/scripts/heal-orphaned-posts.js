import mongoose from "mongoose";
import { config } from "../config/env.config.js";
import { ScheduledPost } from "../models/scheduledPost.model.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { logger } from "../utils/logger.js";

/**
 * Data Healing Script: Relink Orphaned Posts
 * This script identifies posts linked to deleted social accounts and re-links them 
 * to the most recent active social account for the same platform and organization.
 */
const healOrphanedPosts = async (dryRun = true) => {
    try {
        console.log(`\n--- Starting Data Healing (${dryRun ? "DRY RUN" : "LIVE MODE"}) ---`);
        await mongoose.connect(config.MONGO_URI);
        console.log("Connected to MongoDB.");

        // 1. Fetch all social accounts to build a reference map
        const allAccounts = await SocialAccount.find().sort({ updatedAt: -1 }).lean();
        
        // Map: orgId_platform -> latestAccountId
        const accountMap = new Map();
        allAccounts.forEach(acc => {
            const key = `${acc.organizationId}_${acc.platform}`;
            if (!accountMap.has(key)) {
                accountMap.set(key, acc._id);
            }
        });

        console.log(`Found ${allAccounts.length} active social accounts across all organizations.`);

        // 2. Find all posts
        const allPosts = await ScheduledPost.find().lean();
        const activeAccountIds = new Set(allAccounts.map(a => a._id.toString()));

        let orphanedCount = 0;
        let healedCount = 0;
        let unhealableCount = 0;
        const bulkOps = [];

        console.log(`Analyzing ${allPosts.length} total posts for orphaned IDs...`);

        for (const post of allPosts) {
            const postAccountId = post.socialAccountId?.toString();
            
            // Check if account still exists
            if (!activeAccountIds.has(postAccountId)) {
                orphanedCount++;
                const key = `${post.organizationId}_${post.platform}`;
                const replacementId = accountMap.get(key);

                if (replacementId) {
                    healedCount++;
                    if (!dryRun) {
                        bulkOps.push({
                            updateOne: {
                                filter: { _id: post._id },
                                update: { $set: { socialAccountId: replacementId } }
                            }
                        });
                    }
                    if (dryRun) {
                        console.log(`[DRY RUN] Would heal Post ${post._id}: Re-linking ${post.platform} post from deleted account ${postAccountId} to active account ${replacementId}`);
                    }
                } else {
                    unhealableCount++;
                    console.log(`[WARN] Unhealable Post ${post._id}: No active ${post.platform} account found for Org ${post.organizationId}`);
                }
            }
        }

        if (!dryRun && bulkOps.length > 0) {
            console.log(`Executing ${bulkOps.length} updates...`);
            const result = await ScheduledPost.bulkWrite(bulkOps);
            console.log(`Successfully healed ${result.modifiedCount} posts.`);
        }

        console.log("\n--- Healing Summary ---");
        console.log(`Total Posts Scanned: ${allPosts.length}`);
        console.log(`Orphaned Posts Found: ${orphanedCount}`);
        console.log(`Successfully ${dryRun ? "Matched" : "Healed"}: ${healedCount}`);
        console.log(`Unhealable (Missing Platform): ${unhealableCount}`);
        console.log("-----------------------\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Healing failed:", error);
        process.exit(1);
    }
};

// Check for live flag
const isLive = process.argv.includes("--live");
healOrphanedPosts(!isLive);
