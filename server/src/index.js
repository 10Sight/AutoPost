import { app } from "./app.js";
import connectDB from "./db/index.db.js";
import { logger } from "./utils/logger.js";
import { config } from "./config/env.config.js";
import { initializeSubscribers } from "./subscribers/index.subscriber.js";
import { initializeScheduler } from "./jobs/scheduler.js";

/**
 * Production Startup Sequence
 */
const startServer = async () => {
    try {
        // 1. Connect to Database
        await connectDB();

        // 2. Initialize Background Services
        await initializeSubscribers();
        initializeScheduler();

        // 3. Start HTTP Server
        const server = app.listen(config.PORT || 8000, () => {
            logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT || 8000}`);
        });

        // 4. Handle Process Errors
        process.on("unhandledRejection", (err) => {
            logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
            logger.error(err);
            server.close(() => {
                process.exit(1);
            });
        });

    } catch (error) {
        logger.error("FATAL STARTUP ERROR: ", error);
        process.exit(1);
    }
};

startServer();
