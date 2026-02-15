import { eventBus } from "../utils/eventBus.js";
import { EVENTS } from "../events/events.js";
import { logger } from "../utils/logger.js";

const initLoggingSubscriber = () => {
    logger.info("Initializing Logging Subscriber...");

    eventBus.on(EVENTS.POST_CREATED, (data) => {
        logger.info(`[EVENT] POST_CREATED: Post ${data.postId} scheduled for ${data.scheduledAt}`);
    });

    eventBus.on(EVENTS.POST_PUBLISHED, (data) => {
        logger.info(`[EVENT] POST_PUBLISHED: Post ${data.postId} published to ${data.platform} (ID: ${data.platformPostId})`);
    });

    eventBus.on(EVENTS.POST_FAILED, (data) => {
        logger.error(`[EVENT] POST_FAILED: Post ${data.postId} failed. Reason: ${data.error}`);
    });

    eventBus.on(EVENTS.SOCIAL_ACCOUNT_EXPIRED, (data) => {
        logger.warn(`[EVENT] SOCIAL_ACCOUNT_EXPIRED: Account ${data.accountId} (${data.platform}) has expired/invalid tokens.`);
    });
};

export { initLoggingSubscriber };
