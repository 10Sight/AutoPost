import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

console.log(`Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error("Error loading .env:", result.error);
}

import mongoose from "mongoose";
import { config } from "../src/config/env.config.js";
// Re-import config might be needed if it was cached before dotenv load, 
// but config.js does its own dotenv.config(). 
// Let's rely on standard config but ensure we check it.

import { ScheduledPost } from "../src/models/scheduledPost.model.js";
import { eventBus } from "../src/utils/eventBus.js";
import { EVENTS } from "../src/events/events.js";
import { initRecyclingSubscriber } from "../src/subscribers/recycling.subscriber.js";
import { logger } from "../src/utils/logger.js";
import { User } from "../src/models/user.model.js";
import { SocialAccount } from "../src/models/socialAccount.model.js";

// Mute logger for test
logger.info = console.log;
logger.warn = console.warn;
logger.error = console.error;

const runTest = async () => {
    try {
        console.log(`MONGO_URI: ${config.MONGO_URI}`);
        if (!config.MONGO_URI) {
            throw new Error("MONGO_URI is undefined");
        }

        await mongoose.connect(config.MONGO_URI);
        console.log("Connected to DB");

        // Init subscriber
        initRecyclingSubscriber();

        // 1. Create dummy post
        const userId = new mongoose.Types.ObjectId();
        const socialAccountId = new mongoose.Types.ObjectId();

        const originalPost = await ScheduledPost.create({
            userId,
            socialAccountId,
            platform: "x", // twitter
            caption: "Evergreen Test Post",
            scheduledAt: new Date(),
            status: "posted",
            isEvergreen: true,
            evergreenInterval: 7,
            evergreenStatus: "active"
        });

        console.log(`Original Post Created: ${originalPost._id}`);

        // 2. Emit Event
        console.log("Emitting POST_PUBLISHED...");
        eventBus.emit(EVENTS.POST_PUBLISHED, {
            postId: originalPost._id,
            platform: "x",
            platformPostId: "mock_platform_id"
        });

        // 3. Wait for async subscriber
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 4. Check for new post
        const newPost = await ScheduledPost.findOne({
            should_not_exist: { $exists: false }, // just to find *a* post, but we want the one created *after* original
            _id: { $ne: originalPost._id },
            caption: "Evergreen Test Post",
            status: "pending"
        });

        if (newPost) {
            console.log("SUCCESS: New evergreen clone found!");
            console.log(`New Post ID: ${newPost._id}`);
            console.log(`Scheduled At: ${newPost.scheduledAt}`);

            // Validate time (approx 7 days from now)
            const diffDays = (new Date(newPost.scheduledAt) - new Date()) / (1000 * 60 * 60 * 24);
            console.log(`Interval check: ${diffDays.toFixed(1)} days (Expected ~7.0)`);

            // Cleanup
            await ScheduledPost.deleteMany({ caption: "Evergreen Test Post" });
        } else {
            console.error("FAILURE: New evergreen clone NOT found.");
        }

    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

runTest();
