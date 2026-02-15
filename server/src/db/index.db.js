import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { config } from "../config/env.config.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${config.MONGO_URI}`
        );
        logger.info(
            `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        logger.error("MONGODB connection FAILED ", error);
        process.exit(1);
    }
};

export default connectDB;
