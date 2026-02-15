import { eventBus } from "../utils/eventBus.js";
import { EVENTS } from "../events/events.js";
import { logger } from "../utils/logger.js";
import { AuditLog } from "../models/auditLog.model.js";
import { Notification } from "../models/notification.model.js";

export const initAuditSubscriber = () => {
    logger.info("Initializing Audit Subscriber...");

    // Helper to create log
    const createLog = async (action, data) => {
        try {
            await AuditLog.create({
                userId: data.userId, // May be undefined for system actions
                organizationId: data.organizationId,
                action: action,
                entityId: data.postId || data.accountId, // Flexible based on event
                entityType: data.accountId ? "SocialAccount" : "ScheduledPost",
                metadata: data,
            });

            // Trigger real-time notification for specific critical events
            if (action === EVENTS.POST_FAILED) {
                await Notification.create({
                    organizationId: data.organizationId,
                    userId: data.userId,
                    title: "Post Publication Failed",
                    message: `Your post for ${data.platform} failed to publish.`,
                    type: "ERROR",
                    metadata: { postId: data.postId }
                });
            } else if (action === EVENTS.SOCIAL_ACCOUNT_EXPIRED) {
                await Notification.create({
                    organizationId: data.organizationId,
                    userId: data.userId,
                    title: "Social Account Disconnected",
                    message: "One of your social accounts has expired and needs reconnection.",
                    type: "ERROR",
                    metadata: { accountId: data.accountId }
                });
            }
        } catch (error) {
            logger.error(`[Audit] Failed to log action ${action}:`, error);
        }
    };

    eventBus.on(EVENTS.POST_CREATED, (data) => createLog(EVENTS.POST_CREATED, data));
    eventBus.on(EVENTS.POST_PUBLISHED, (data) => createLog(EVENTS.POST_PUBLISHED, data));
    eventBus.on(EVENTS.POST_FAILED, (data) => createLog(EVENTS.POST_FAILED, data));
    eventBus.on(EVENTS.POST_DELETED, (data) => createLog(EVENTS.POST_DELETED, data));
    eventBus.on(EVENTS.POST_RETRY_SCHEDULED, (data) => createLog(EVENTS.POST_RETRY_SCHEDULED, data));
    eventBus.on(EVENTS.SOCIAL_ACCOUNT_EXPIRED, (data) => createLog(EVENTS.SOCIAL_ACCOUNT_EXPIRED, data));

    // YouTube Events
    eventBus.on(EVENTS.YOUTUBE_CHANNEL_CONNECTED, (data) => createLog(EVENTS.YOUTUBE_CHANNEL_CONNECTED, data));
    eventBus.on(EVENTS.YOUTUBE_VIDEO_SCHEDULED, (data) => createLog(EVENTS.YOUTUBE_VIDEO_SCHEDULED, data));
    eventBus.on(EVENTS.YOUTUBE_VIDEO_UPLOADED, (data) => createLog(EVENTS.YOUTUBE_VIDEO_UPLOADED, data));
    eventBus.on(EVENTS.YOUTUBE_VIDEO_PUBLISHED, (data) => createLog(EVENTS.YOUTUBE_VIDEO_PUBLISHED, data));
    eventBus.on(EVENTS.YOUTUBE_UPLOAD_FAILED, (data) => createLog(EVENTS.YOUTUBE_UPLOAD_FAILED, data));
};
