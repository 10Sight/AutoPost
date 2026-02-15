import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { logger } from "../utils/logger.js";

import { config } from "../config/env.config.js";

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // file has been uploaded successfull
        // console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file
        return response;
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
        }
        logger.error("Cloudinary upload failed", {
            message: error.message,
            code: error.http_code,
            name: error.name,
            stack: error.stack
        });
        return null;
    }
};

export { uploadOnCloudinary };
