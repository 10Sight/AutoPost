import { Rule } from "../models/rule.model.js";

/**
 * Utility to get values from nested objects using dot notation
 */
const getValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

/**
 * Evaluate a single condition
 */
const evaluateCondition = (context, condition) => {
    const { field, operator, value } = condition;
    const contextValue = getValue(context, field);

    switch (operator) {
        case "eq":
            return contextValue === value;
        case "neq":
            return contextValue !== value;
        case "gt":
            return contextValue > value;
        case "lt":
            return contextValue < value;
        case "contains":
            return String(contextValue).toLowerCase().includes(String(value).toLowerCase());
        case "not_contains":
            return !String(contextValue).toLowerCase().includes(String(value).toLowerCase());
        case "between":
            if (Array.isArray(value) && value.length === 2) {
                return contextValue >= value[0] && contextValue <= value[1];
            }
            return false;
        default:
            return false;
    }
};

/**
 * Evaluate all rules for a specific trigger and organization
 */
export const evaluateRules = async (organizationId, trigger, context) => {
    const rules = await Rule.find({
        organizationId,
        trigger,
        active: true,
    }).sort({ priority: -1 });

    const results = {
        block: [],
        warn: [],
        notify: [],
        log: [],
    };

    for (const rule of rules) {
        const allConditionsMet = rule.conditions.every(cond => evaluateCondition(context, cond));

        if (allConditionsMet) {
            rule.actions.forEach(action => {
                const actionType = action.type.toLowerCase();
                if (results[actionType]) {
                    results[actionType].push({
                        ruleName: rule.name,
                        message: action.message,
                        metadata: action.metadata,
                    });
                }
            });
        }
    }

    return results;
};
