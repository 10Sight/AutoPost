import cron from "node-cron";
import { ScheduledPost } from "../models/scheduledPost.model.js";
import { AIJob } from "../models/aiJob.model.js";
import { logger } from "../utils/logger.js";
import { processPost } from "./post.processor.js";

const AI_JOB_STALE_MINUTES = 10;

// AI generation jobs run as fire-and-forget in-process async workers (no durable
// queue). If the server restarts mid-generation, or a call hangs past its own
// axios timeout, the job's DB row is orphaned at "pending"/"processing" forever
// and the client's status poll spins indefinitely. This sweep releases those.
const runAiJobCleanup = async () => {
    try {
        const staleCutoff = new Date(Date.now() - AI_JOB_STALE_MINUTES * 60 * 1000);
        const result = await AIJob.updateMany(
            { status: { $in: ["pending", "processing"] }, updatedAt: { $lt: staleCutoff } },
            { $set: { status: "failed", error: "Generation timed out. Please try again." } }
        );
        if (result.modifiedCount > 0) {
            logger.warn(`[AI Cleanup] Reset ${result.modifiedCount} stale AI job(s) to failed.`);
        }
    } catch (error) {
        logger.error("Error in AI job cleanup sweep:", error);
    }
};

const runScheduler = async () => {
    logger.info("Running scheduled posts trigger...");

    try {
        const now = new Date();
        // Find posts that are pending and due
        // Find posts that are pending and due OR failed but ready for retry
        const pendingPosts = await ScheduledPost.find({
            $or: [
                { status: { $in: ["pending", "scheduled"] }, scheduledAt: { $lte: now } },
                {
                    status: "failed",
                    nextRetryAt: { $lte: now },
                    // Ensure we don't pick up posts that have exceeded max retries if nextRetryAt wasn't cleared for some reason,
                    // though post.processor clears it.
                    $expr: { $lt: ["$retryCount", "$maxRetries"] }
                }
            ]
        }).select("_id");

        if (pendingPosts.length === 0) {
            // logger.info("No pending posts found."); // Reduce noise
            return;
        }

        logger.info(`Found ${pendingPosts.length} pending posts. Dispatching...`);

        // Process posts.
        // In a BullMQ setup, this is where we would execute: queue.add('post', { postId: post._id })
        // For now, we process them immediately.
        const results = await Promise.allSettled(
            pendingPosts.map((post) => processPost(post._id))
        );

        const successful = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        logger.info(
            `Job Cycle Complete. Success: ${successful}, Failed: ${failed}`
        );
    } catch (error) {
        logger.error("Error in scheduler trigger:", error);
        if (error.stack) {
            logger.error("Scheduler Error Stack:", error.stack);
        }
    }
};

const initScheduler = () => {
    // Run every minute
    cron.schedule("* * * * *", () => {
        runScheduler();
    });
    logger.info("Scheduler initialized (interval: 1 minute).");

    // Run every 5 minutes
    cron.schedule("*/5 * * * *", () => {
        runAiJobCleanup();
    });
    logger.info("AI job cleanup sweep initialized (interval: 5 minutes).");
};

export { initScheduler };

