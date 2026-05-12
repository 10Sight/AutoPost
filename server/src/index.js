import { config } from "./config/env.config.js";
console.log("[Index] Importing connectDB...");
import connectDB from "./db/index.db.js";
console.log("[Index] Importing app...");
import { app } from "./app.js";
console.log("[Index] Importing logger...");
import { logger } from "./utils/logger.js";
console.log("[Index] Importing other modules...");
import { initScheduler } from "./jobs/scheduler.job.js";
import { initLoggingSubscriber } from "./subscribers/logging.subscriber.js";
import { initSocketSubscriber } from "./subscribers/socket.subscriber.js";
import { initAuditSubscriber } from "./subscribers/audit.subscriber.js";
import { initRecyclingSubscriber } from "./subscribers/recycling.subscriber.js";
import { initRuleSubscriber } from "./subscribers/rule.subscriber.js";
console.log("[Index] All modules imported successfully!");

initLoggingSubscriber();
initAuditSubscriber();
initRecyclingSubscriber();
initRuleSubscriber();

connectDB()
    .then(() => {
        app.on("error", (error) => {
            logger.error("ERROR: ", error);
            throw error;
        });

        const server = app.listen(config.PORT, () => {
            logger.info(
                `http://localhost:${config.PORT}`
            );
            initScheduler();
            initSocketSubscriber(server);
        });

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
            logger.error(error);
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
    })
    .catch((err) => {
        logger.error("MONGO db connection failed !!! ", err);
    });
