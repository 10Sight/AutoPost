import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const environment = process.env.NODE_ENV || "development";
const envFile = `.env.${environment}`;

// Load environment-specific file if it exists, otherwise fall back to .env
if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config({ path: "./.env" });
}

console.log(`[Configuration] Loaded environment: ${environment}`);

const _config = {
    PORT: process.env.PORT || 8000,
    MONGO_URI: process.env.MONGO_URI,
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
    INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
    LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
    X_CLIENT_ID: process.env.X_CLIENT_ID,
    X_CLIENT_SECRET: process.env.X_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV || "development",
};

// Validate required environment variables
const requiredFields = [
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
];

requiredFields.forEach((field) => {
    if (!_config[field]) {
        throw new Error(`Environment variable ${field} is missing!`);
    }
});

export const config = Object.freeze(_config);
