import EventEmitter from "events";
import { logger } from "./logger.js";

class EventBus extends EventEmitter {
    constructor() {
        super();
        // Ensure we capture error events to prevent node process crash
        this.on("error", (error) => {
            logger.error(`[EventBus] Unhandled error: ${error.message}`);
        });
    }

    /**
     * Emit an event with data.
     * @param {string} event - Event name
     * @param {object} data - Event payload
     */
    emit(event, data) {
        logger.debug(`[EventBus] Emitting: ${event}`);
        return super.emit(event, data);
    }
}

const eventBus = new EventBus();

export { eventBus };
