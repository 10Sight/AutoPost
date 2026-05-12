import { config } from "./config/env.config.js";

async function startServer() {
    try {
        console.log("[Bootstrap] Starting initialization sequence...");

        console.log("[Bootstrap] Loading Database Module...");
        const { default: connectDB } = await import("./db/index.db.js");

        console.log("[Bootstrap] Loading Express Application Module...");
        const { app } = await import("./app.js");

        console.log("[Bootstrap] Loading Logger Module...");
        const { logger } = await import("./utils/logger.js");

        console.log("[Bootstrap] Loading Scheduler & Subscribers...");
        const { initScheduler } = await import("./jobs/scheduler.job.js");
        const { initLoggingSubscriber } = await import("./subscribers/logging.subscriber.js");
        const { initSocketSubscriber } = await import("./subscribers/socket.subscriber.js");
        const { initAuditSubscriber } = await import("./subscribers/audit.subscriber.js");
        const { initRecyclingSubscriber } = await import("./subscribers/recycling.subscriber.js");
        const { initRuleSubscriber } = await import("./subscribers/rule.subscriber.js");

        console.log("[Bootstrap] Initializing Subscribers...");
        initLoggingSubscriber();
        initAuditSubscriber();
        initRecyclingSubscriber();
        initRuleSubscriber();

        console.log("[Bootstrap] Connecting to Database...");
        await connectDB();

        console.log("[Bootstrap] Starting HTTP Server...");
        app.on("error", (error) => {
            logger.error("SERVER ERROR: ", error);
            throw error;
        });

        const server = app.listen(config.PORT, () => {
            logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
            initScheduler();
            initSocketSubscriber(server);
        });

        // Error Handlers
        const exitHandler = () => {
            if (server) {
                server.close(() => {
                    logger.info("Server closed");
                    process.exit(1);
                });
            } else {
                process.exit(1);
            }
        };

        const unexpectedErrorHandler = (error) => {
            logger.error("UNEXPECTED ERROR:", error);
            exitHandler();
        };

        process.on("uncaughtException", unexpectedErrorHandler);
        process.on("unhandledRejection", unexpectedErrorHandler);

        process.on("SIGTERM", () => {
            logger.info("SIGTERM received");
            if (server) {
                server.close(() => {
                    logger.info("Process terminated");
                    process.exit(0);
                });
            }
        });

    } catch (error) {
        console.error("\nFATAL BOOTSTRAP ERROR:");
        console.error(error);
        process.exit(1);
    }
}

startServer();
