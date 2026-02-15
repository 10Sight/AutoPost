import PlatformService from "./platform.service.js";
import { logger } from "../utils/logger.js";

import axios from "axios";

class FacebookService extends PlatformService {
    async postContent(account, post) {
        const { caption: content, mediaId: media } = post;
        const mediaUrl = media ? media.url : null;
        const pageId = account.platformUserId;
        const accessToken = account.accessToken;
        const version = "v18.0";
        const baseUrl = `https://graph.facebook.com/${version}/${pageId}`;

        logger.info(`[Facebook] Posting to Page ${account.platformUserName}`);

        let endpoint = `${baseUrl}/feed`;
        const params = {
            access_token: accessToken,
            message: content,
        };

        if (mediaUrl) {
            const isVideo = mediaUrl.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/i);
            if (isVideo) {
                // For video, it's safer to use non-resumable upload for small files or graph-video
                // But for simplicity/URLs:
                // Facebook Page Video from URL
                endpoint = `https://graph-video.facebook.com/${version}/${pageId}/videos`;
                params.file_url = mediaUrl;
                params.description = content;
                delete params.message;
            } else {
                endpoint = `${baseUrl}/photos`;
                params.url = mediaUrl;
                params.caption = content;
                delete params.message;
            }
        }

        const response = await axios.post(endpoint, null, { params });

        if (!response.data || !response.data.id) {
            // Sometimes video uploads return success: true but async processing
            if (response.data && response.data.success) {
                return {
                    id: "pending_async_processing",
                    url: "https://facebook.com", // Placeholder until processed
                }
            }
            throw new Error("Failed to post to Facebook");
        }

        return {
            id: response.data.id,
            url: `https://facebook.com/${response.data.id}`, // Approximate URL
        };
    }
}

export default new FacebookService();
