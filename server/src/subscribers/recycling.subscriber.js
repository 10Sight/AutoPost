import { eventBus } from "../utils/eventBus.js";
import { EVENTS } from "../events/events.js";
import { ScheduledPost } from "../models/scheduledPost.model.js";
import { logger } from "../utils/logger.js";

const handleEvergreenPost = async (data) => {
    try {
        const { postId } = data;
        const post = await ScheduledPost.findById(postId);

        if (!post) {
            logger.warn(`[Recycling] Post ${postId} not found for recycling check`);
            return;
        }

        if (post.isEvergreen && post.evergreenStatus === "active") {
            const intervalDays = post.evergreenInterval || 30;
            const nextScheduledAt = new Date();
            nextScheduledAt.setDate(nextScheduledAt.getDate() + intervalDays);

            // Clone the post
            const newPost = new ScheduledPost({
                userId: post.userId,
                socialAccountId: post.socialAccountId,
                platform: post.platform,
                mediaId: post.mediaId,
                caption: post.caption,
                scheduledAt: nextScheduledAt,
                status: "pending",
                isEvergreen: true, // Keep it evergreen
                evergreenInterval: post.evergreenInterval,
                evergreenStatus: "active",
                logs: [
                    {
                        level: "info",
                        message: `Auto-recycled from post ${post._id}`,
                        timestamp: new Date(),
                    },
                ],
            });

            await newPost.save();
            logger.info(
                `[Recycling] Post ${post._id} recycled. New post ${newPost._id} scheduled for ${nextScheduledAt}`
            );

            // Emit creation event for audit log
            eventBus.emit(EVENTS.POST_CREATED, {
                postId: newPost._id,
                userId: post.userId,
                platform: post.platform,
                scheduledAt: nextScheduledAt,
            });
        }
    } catch (error) {
        logger.error(`[Recycling] Error handling evergreen post: ${error.message}`);
    }
};

// Listen for successful publications
eventBus.on(EVENTS.POST_PUBLISHED, handleEvergreenPost);

export const initRecyclingSubscriber = () => {
    logger.info("Recycling Subscriber initialized");
};
