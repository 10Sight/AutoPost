import { app } from "./app.js";
import connectDB from "./db/index.db.js";
import { logger } from "./utils/logger.js";
import { config } from "./config/env.config.js";

// Import all background services & jobs
import { initScheduler } from "./jobs/scheduler.job.js";
import { initLoggingSubscriber } from "./subscribers/logging.subscriber.js";
import { initSocketSubscriber } from "./subscribers/socket.subscriber.js";
import { initAuditSubscriber } from "./subscribers/audit.subscriber.js";
import { initRecyclingSubscriber } from "./subscribers/recycling.subscriber.js";
import { initRuleSubscriber } from "./subscribers/rule.subscriber.js";

/**
 * Production Startup Sequence
 */
const startServer = async () => {
    try {
        // 1. Initialize Early Subscribers (No DB needed)
        initLoggingSubscriber();
        initAuditSubscriber();
        initRecyclingSubscriber();
        initRuleSubscriber();

        // 2. Connect to Database
        await connectDB();

        // 3. Start HTTP Server
        const server = app.listen(config.PORT || 8000, () => {
            logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT || 8000}`);
            
            // 4. Initialize Post-Server Services
            initScheduler();
            initSocketSubscriber(server);
        });

        // --- Production Process Management ---

        const exitHandler = () => {
            if (server) {
                server.close(() => {
                    logger.info("Server closed");
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        };

        const unexpectedErrorHandler = (error) => {
            logger.error("Unexpected Error! 💥", error);
            exitHandler();
        };

        process.on("uncaughtException", unexpectedErrorHandler);
        process.on("unhandledRejection", unexpectedErrorHandler);

        process.on("SIGTERM", () => {
            logger.info("SIGTERM received. Performing graceful shutdown...");
            exitHandler();
        });

    } catch (error) {
        logger.error("FATAL STARTUP ERROR: ", error);
        process.exit(1);
    }
};

startServer();
