import { ScheduledPost } from "../models/scheduledPost.model.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { logger } from "../utils/logger.js";
import { calculateBackoff, isRetryableError } from "../utils/retryHandler.js";
import { eventBus } from "../utils/eventBus.js";
import { EVENTS } from "../events/events.js";
import instagramService from "../services/instagram.service.js";
import linkedinService from "../services/linkedin.service.js";
import facebookService from "../services/facebook.service.js";
import xService from "../services/x.service.js";
import youtubeService from "../services/youtube.service.js";

const platformServices = {
    instagram: instagramService,
    linkedin: linkedinService,
    facebook: facebookService,
    x: xService,
    youtube: youtubeService,
};

/**
 * Processes a single scheduled post.
 * This function is designed to be "BullMQ-ready" - it can be easily wrapped in a queue worker.
 * @param {string} postId - The ID of the ScheduledPost to process
 */
export const processPost = async (postId) => {
    logger.info(`Processing post ${postId}... (v2-fix-applied)`);

    try {
        // Atomic Lock: Try to set status to 'processing' if it is 'pending', 'scheduled', or 'failed' (retry)
        // This prevents race conditions if multiple workers pick up the same job.
        const post = await ScheduledPost.findOneAndUpdate(
            { _id: postId, status: { $in: ["pending", "scheduled", "failed"] } },
            { $set: { status: "processing" } },
            { returnDocument: "after" }
        ).populate("mediaId");

        if (!post) {
            logger.warn(`Post ${postId} could not be locked (already processing or not pending). Skipping.`);
            return;
        }

        const account = await SocialAccount.findById(post.socialAccountId);

        if (!account) {
            logger.error(`Social account not found for post ${postId}`);
            post.status = "failed";
            post.error = "Social account not found";
            await post.save();
            return;
        }

        const service = platformServices[post.platform];

        if (!service) {
            logger.error(`Service not found for platform ${post.platform}`);
            post.status = "failed";
            post.error = "Platform service not implemented";
            await post.save();
            return;
        }

        const mediaUrl = post.mediaId ? post.mediaId.url : null;

        // Platform-specific validation and logging
        if (post.platform === "youtube") {
            if (!mediaUrl) {
                throw new Error("YouTube posts require a video.");
            }
            logger.info(`[YouTube] Upload started for post ${postId}`);
            post.logs.push({ level: "info", message: "Upload started", timestamp: new Date() });
            await post.save();
        }

        // Attempt to post
        const result = await service.postContent(
            account,
            post
        );

        // After successful post/schedule
        if (post.platform === "youtube") {
            logger.info(`[YouTube] Upload completed for post ${postId}`);
            post.logs.push({ level: "info", message: "Upload completed", timestamp: new Date() });

            if (post.publishAt || (result.status === "scheduled" || result.status === "uploaded")) {
                const publishTime = post.publishAt || post.scheduledAt;
                logger.info(`[YouTube] Publish scheduled for ${publishTime}`);
                post.logs.push({
                    level: "info",
                    message: `Publish scheduled for ${publishTime}`,
                    timestamp: new Date()
                });
            }
        }

        post.status = post.platform === "youtube" ? "scheduled" : "posted"; // YouTube posts are technically 'scheduled' on their end until public
        post.platformPostId = result.id;
        post.error = null; // Clear any previous errors
        await post.save();

        eventBus.emit(EVENTS.POST_PUBLISHED, {
            postId: post._id,
            platform: post.platform,
            platformPostId: result.id,
        });

        logger.info(`Successfully processed ${postId} for ${post.platform}`);
        return result;

    } catch (error) {
        logger.error(`Failed to process post ${postId}:`, error);

        // YouTube specific failure logging
        if (postId) {
            try {
                const post = await ScheduledPost.findById(postId);
                if (post && post.platform === "youtube") {
                    post.logs.push({ level: "error", message: `Publish failed: ${error.message}`, timestamp: new Date() });
                    await post.save();
                }
            } catch (err) {
                logger.warn("Failed to log YouTube failure to post", err);
            }
        }

        // Check for Social Account Expiration
        if (error.message && (error.message.includes("auth") || error.message.includes("token") || error.statusCode === 401 || error.statusCode === 403)) {
            try {
                const postForAccount = await ScheduledPost.findById(postId);
                if (postForAccount) {
                    eventBus.emit(EVENTS.SOCIAL_ACCOUNT_EXPIRED, {
                        accountId: postForAccount.socialAccountId,
                        platform: postForAccount.platform,
                        error: error.message
                    });
                }
            } catch (e) {
                logger.warn("Could not emit SOCIAL_ACCOUNT_EXPIRED event", e);
            }
        }

        // Retry Logic
        try {
            const postToUpdate = await ScheduledPost.findById(postId);
            if (postToUpdate) {
                // Determine if we should retry
                const canRetry =
                    postToUpdate.retryCount < postToUpdate.maxRetries &&
                    isRetryableError(error);

                const logEntry = {
                    level: "error",
                    message: error.message || "Unknown error occurred",
                    timestamp: new Date()
                };

                if (canRetry) {
                    postToUpdate.retryCount += 1;
                    postToUpdate.nextRetryAt = calculateBackoff(postToUpdate.retryCount);
                    postToUpdate.status = "failed"; // Mark as failed temporarily
                    postToUpdate.error = `Attempt ${postToUpdate.retryCount} failed: ${error.message}`;

                    eventBus.emit(EVENTS.POST_RETRY_SCHEDULED, {
                        postId: postToUpdate._id,
                        retryCount: postToUpdate.retryCount,
                        nextRetryAt: postToUpdate.nextRetryAt,
                        error: error.message
                    });

                    logger.info(`Scheduled retry ${postToUpdate.retryCount} for post ${postId} at ${postToUpdate.nextRetryAt}`);
                } else {
                    postToUpdate.status = "failed";
                    postToUpdate.nextRetryAt = undefined; // No more retries
                    postToUpdate.error = error.message;

                    // Emit POST_FAILED only on final failure or non-retryable error
                    eventBus.emit(EVENTS.POST_FAILED, {
                        postId: postToUpdate._id,
                        error: error.message,
                        retryCount: postToUpdate.retryCount
                    });

                    if (postToUpdate.retryCount >= postToUpdate.maxRetries) {
                        logEntry.message = `Max retries (${postToUpdate.maxRetries}) reached. Final error: ${error.message}`;
                    } else {
                        logEntry.message = `Non-retryable error: ${error.message}`;
                    }
                }

                postToUpdate.logs.push(logEntry);
                await postToUpdate.save();
            }
        } catch (dbError) {
            logger.error(`Critical: Failed to update error status for post ${postId}`, dbError);
        }

        // We do NOT re-throw if we handled the retry gracefully, 
        // effectively "absorbing" the error from the scheduler's perspective 
        // to prevent it from crashing or retrying immediately if it was a queue system.
        // However, Promise.allSettled in scheduler will see this as resolved (success) 
        // but we verify status via DB or just log it.
        // Actually, let's throw it so scheduler knows it failed this specific attempt.
        throw error;
    }
};
