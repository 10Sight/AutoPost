import { eventBus } from "../utils/eventBus.js";
import { EVENTS } from "../events/events.js";
import { logger } from "../utils/logger.js";
import { AuditLog } from "../models/auditLog.model.js";
import { Notification } from "../models/notification.model.js";
import { evaluateRules } from "../services/ruleEngine.service.js";

export const initRuleSubscriber = () => {
    logger.info("Initializing Rule Engine Subscriber...");

    const handleEvent = async (trigger, data) => {
        try {
            const { organizationId } = data;
            if (!organizationId) return;

            const results = await evaluateRules(organizationId, trigger, data);

            // POST-EVENT rules only care about NOTIFY and LOG
            // BLOCK/WARN are only for BEFORE_SCHEDULE

            for (const notifyAction of results.notify) {
                await AuditLog.create({
                    organizationId,
                    userId: data.userId,
                    action: "RULE_NOTIFICATION",
                    entityId: data.postId,
                    entityType: "ScheduledPost",
                    message: notifyAction.message,
                    metadata: { ruleName: notifyAction.ruleName, ...notifyAction.metadata }
                });

                // Create User Notification
                await Notification.create({
                    organizationId,
                    userId: data.userId,
                    title: `Rule: ${notifyAction.ruleName}`,
                    message: notifyAction.message,
                    type: "WARNING",
                    metadata: { ruleName: notifyAction.ruleName, postId: data.postId }
                });
                logger.info(`[RuleEngine] Notification & Audit created for ${trigger}: ${notifyAction.message}`);
            }

            for (const logAction of results.log) {
                logger.warn(`[RuleEngine] ${logAction.ruleName}: ${logAction.message}`, { trigger, data });
            }
        } catch (error) {
            logger.error(`[RuleEngine] Error evaluating rules for ${trigger}:`, error);
        }
    };

    eventBus.on(EVENTS.POST_PUBLISHED, (data) => handleEvent("POST_PUBLISHED", data));
    eventBus.on(EVENTS.POST_FAILED, (data) => handleEvent("POST_FAILED", data));
};
