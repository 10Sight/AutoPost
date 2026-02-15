import PlatformService from "./platform.service.js";
import { logger } from "../utils/logger.js";
import axios from 'axios';

class InstagramService extends PlatformService {
    async postContent(account, post) {
        const { caption: content, mediaId: media } = post;
        const mediaUrl = media ? media.url : null;
        if (!mediaUrl) {
            throw new Error("Instagram requires media (image/video) to post.");
        }

        const userId = account.platformUserId;
        const accessToken = account.accessToken;
        const version = "v18.0";
        const baseUrl = `https://graph.facebook.com/${version}/${userId}`;

        logger.info(`[Instagram] Creating media container for ${account.platformUserName}`);

        // Step 1: Create Media Container
        const containerParams = {
            access_token: accessToken,
            caption: content,
        };

        // Determine if image or video based on file extension or type
        // Simpler check for now - improvement: pass mediaType from processor
        const isVideo = mediaUrl.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/i);

        if (isVideo) {
            containerParams.media_type = "VIDEO";
            containerParams.video_url = mediaUrl;
        } else {
            containerParams.image_url = mediaUrl;
        }

        const containerResponse = await axios.post(
            `${baseUrl}/media`,
            null,
            { params: containerParams }
        ).catch(error => {
            logger.error(`[Instagram] Container creation failed:`, error.response?.data || error.message);
            throw new Error(`Instagram Container Creation Failed: ${JSON.stringify(error.response?.data?.error || error.message)}`);
        });

        if (!containerResponse || !containerResponse.data || !containerResponse.data.id) {
            throw new Error("Failed to create Instagram media container");
        }

        const containerId = containerResponse.data.id;
        logger.info(`[Instagram] Media container created: ${containerId}. Publishing...`);

        // Step 2: Publish Media Container
        const publishParams = {
            creation_id: containerId,
            access_token: accessToken,
        };

        const publishResponse = await axios.post(
            `${baseUrl}/media_publish`,
            null,
            { params: publishParams }
        ).catch(error => {
            logger.error(`[Instagram] Publish failed:`, error.response?.data || error.message);
            throw new Error(`Instagram Publish Failed: ${JSON.stringify(error.response?.data?.error || error.message)}`);
        });

        if (!publishResponse || !publishResponse.data || !publishResponse.data.id) {
            throw new Error("Failed to publish Instagram media");
        }

        return {
            id: publishResponse.data.id,
            url: `https://instagram.com/p/${publishResponse.data.id}`, // Note: This URL is an approximation; API doesn't always return permalink immediately
        };
    }
}

export default new InstagramService();
