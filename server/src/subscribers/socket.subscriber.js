import { Server } from "socket.io";
import { eventBus } from "../utils/eventBus.js";
import { EVENTS } from "../events/events.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/env.config.js";

let io;

export const initSocketSubscriber = (httpServer) => {
    logger.info("Initializing Socket.io Subscriber...");

    io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                config.CORS_ORIGIN
            ].filter(Boolean),
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        logger.info(`[Socket] Client connected: ${socket.id}`);

        // Join user-specific room for targeted events (future proofing)
        // For now, we just broadcast to everyone or handle simple auth if needed
        // socket.join(socket.handshake.auth.userId); 

        socket.on("disconnect", () => {
            logger.info(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    // Listen to EventBus and emit to Socket.io

    eventBus.on(EVENTS.POST_CREATED, (data) => {
        io.emit(EVENTS.POST_CREATED, data);
    });

    eventBus.on(EVENTS.POST_PUBLISHED, (data) => {
        io.emit(EVENTS.POST_PUBLISHED, data);
    });

    eventBus.on(EVENTS.POST_FAILED, (data) => {
        io.emit(EVENTS.POST_FAILED, data);
    });

    eventBus.on(EVENTS.SOCIAL_ACCOUNT_EXPIRED, (data) => {
        io.emit(EVENTS.SOCIAL_ACCOUNT_EXPIRED, data);
    });
};
