import { ScheduledPost } from "../models/scheduledPost.model.js";
import { logger } from "../utils/logger.js";

/**
 * Heuristic analysis of best posting times based on past engagement.
 * @param {string} userId - The user ID to analyze
 * @param {string} platform - The platform filter (optional)
 * @returns {Promise<Array>} - Array of suggested time slots
 */
export const getSmartSuggestions = async (userId, platform) => {
    try {
        // 1. Fetch past successful posts with analytics
        const query = {
            userId,
            status: "posted",
            "analytics.likes": { $exists: true }, // Ensure we have some data
        };

        if (platform) {
            query.platform = platform;
        }

        // Get last 100 posts to analyze
        const posts = await ScheduledPost.find(query)
            .sort({ scheduledAt: -1 })
            .limit(100)
            .select("scheduledAt analytics platform");

        if (posts.length < 5) {
            return getFallbackSuggestions(platform);
        }

        // 2. Aggregate engagement by Hour and Day
        const heatMap = {}; // "Day-Hour" -> { totalScore, count }

        posts.forEach((post) => {
            const date = new Date(post.scheduledAt);
            const day = date.getDay(); // 0-6
            const hour = date.getHours(); // 0-23
            const key = `${day}-${hour}`;

            // Simple heuristic score: Likes + 2*Comments + 3*Shares
            const score =
                (post.analytics?.likes || 0) +
                (post.analytics?.comments || 0) * 2 +
                (post.analytics?.shares || 0) * 3;

            if (!heatMap[key]) {
                heatMap[key] = { totalScore: 0, count: 0 };
            }
            heatMap[key].totalScore += score;
            heatMap[key].count += 1;
        });

        // 3. Calculate Average Score per Slot
        const suggestions = Object.keys(heatMap)
            .map((key) => {
                const [day, hour] = key.split("-").map(Number);
                const { totalScore, count } = heatMap[key];
                return {
                    day,
                    hour,
                    score: totalScore / count,
                    count, // Confidence factor
                };
            })
            .sort((a, b) => b.score - a.score) // Sort by highest score
            .slice(0, 3); // Top 3

        // 4. Transform to friendly format (Next available slots)
        return formatSuggestions(suggestions);

    } catch (error) {
        logger.error(`Smart Schedule Error: ${error.message}`);
        return getFallbackSuggestions(platform);
    }
};

const getFallbackSuggestions = (platform) => {
    // Industry standard best times (Mock)
    // Mon 10AM, Wed 2PM, Fri 11AM
    const now = new Date();
    const suggestions = [];

    // Generate 3 slots for tomorrow/next days at "ideal" times
    for (let i = 1; i <= 3; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        date.setHours(11, 0, 0, 0); // Default 11 AM
        suggestions.push({
            date: date.toISOString(),
            reason: "Industry Best Practice (Fallback)",
            score: 0
        });
    }
    return suggestions;
};

const formatSuggestions = (topSlots) => {
    const now = new Date();
    return topSlots.map(slot => {
        // Find next occurrence of this Day-Hour
        const date = new Date(now);
        date.setHours(slot.hour, 0, 0, 0);

        let dayDiff = (slot.day - date.getDay() + 7) % 7;
        if (dayDiff === 0 && date <= now) {
            dayDiff = 7; // Next week if today's time passed
        }
        date.setDate(date.getDate() + dayDiff);

        return {
            date: date.toISOString(),
            reason: "High Engagement History",
            score: Math.round(slot.score * 10) / 10
        };
    });
};
