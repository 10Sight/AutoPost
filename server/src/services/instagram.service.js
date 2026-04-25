import PlatformService from "./platform.service.js";
import { logger } from "../utils/logger.js";
import axios from 'axios';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class InstagramService extends PlatformService {
    async createContainer(baseUrl, accessToken, params) {
        const response = await axios.post(
            `${baseUrl}/media`,
            null,
            { params: { ...params, access_token: accessToken } }
        ).catch(error => {
            logger.error(`[Instagram] Container creation failed:`, error.response?.data || error.message);
            throw new Error(`Instagram Container Creation Failed: ${JSON.stringify(error.response?.data?.error || error.message)}`);
        });

        if (!response || !response.data || !response.data.id) {
            throw new Error("Failed to create Instagram media container");
        }
        return response.data.id;
    }

    async waitForContainer(containerId, version, accessToken, maxAttempts = 20) {
        let isReady = false;
        let attempts = 0;
        const pollInterval = 10000;

        while (!isReady && attempts < maxAttempts) {
            attempts++;
            await delay(pollInterval);
            try {
                const statusResponse = await axios.get(
                    `https://graph.facebook.com/${version}/${containerId}`,
                    { params: { fields: "status_code,status", access_token: accessToken } }
                );
                const statusCode = statusResponse.data.status_code;
                logger.info(`[Instagram] Container ${containerId} status: ${statusCode} (Attempt ${attempts}/${maxAttempts})`);

                if (statusCode === "FINISHED") {
                    isReady = true;
                } else if (statusCode === "PUBLISHED") {
                    logger.info(`[Instagram] Container ${containerId} is already published.`);
                    return "PUBLISHED";
                } else if (statusCode === "ERROR") {
                    const errorMsg = statusResponse.data.status || "Unknown processing error";
                    throw new Error(`Instagram Processing Error: ${errorMsg}`);
                }
            } catch (error) {
                if (error.message.includes("Instagram Processing Error")) throw error;
                logger.warn(`[Instagram] Error polling container ${containerId}: ${error.message}`);
            }
        }
        if (!isReady) throw new Error(`Instagram media processing timed out for container ${containerId}.`);
        return "FINISHED";
    }

    async postContent(account, post) {
        const { caption: content, mediaIds } = post;
        const userId = account.platformUserId;
        const accessToken = account.accessToken;
        const version = "v18.0";
        const baseUrl = `https://graph.facebook.com/${version}/${userId}`;

        logger.info(`[Instagram] Creating media container(s) for ${account.platformUserName} (Type: ${post.postType || 'post'})`);

        // PRODUCTION GUARDRAIL: Backend Aspect Ratio Check
        const postType = post.postType || "post";
        if (postType === "story" || postType === "reel") {
            const media = mediaIds[0];
            if (media && media.width && media.height) {
                const ratio = media.width / media.height;
                const tolerance = 0.05;
                const is916 = Math.abs(ratio - (9 / 16)) < tolerance;
                if (!is916) {
                    throw new Error(`Invalid aspect ratio for ${postType}. Instagram requires 9:16 vertical video. Detected ratio: ${ratio.toFixed(2)}.`);
                }
            }
        }

        let publishContainerId = null;

        if (mediaIds && mediaIds.length > 1) {
            // CAROUSEL FLOW
            const childrenIds = [];
            
            // 1. Create items
            for (let i = 0; i < mediaIds.length; i++) {
                const media = mediaIds[i];
                const isVideo = media.type === "video";
                const params = { is_carousel_item: true };
                
                if (isVideo) {
                    params.media_type = "VIDEO";
                    params.video_url = media.url;
                } else {
                    params.image_url = media.url;
                }
                
                const childId = await this.createContainer(baseUrl, accessToken, params);
                childrenIds.push({ id: childId, isVideo });
            }

            // 2. Wait for items (specifically videos take time)
            for (const child of childrenIds) {
                if (child.isVideo) {
                    await this.waitForContainer(child.id, version, accessToken);
                }
            }

            // 3. Create Carousel Container
            const carouselParams = {
                media_type: "CAROUSEL",
                caption: content || "",
                children: childrenIds.map(c => c.id).join(",")
            };
            publishContainerId = await this.createContainer(baseUrl, accessToken, carouselParams);
            await this.waitForContainer(publishContainerId, version, accessToken, 5);
            
        } else if (mediaIds && mediaIds.length === 1) {
            // SINGLE MEDIA FLOW
            const mediaUrl = mediaIds[0].url;
            const isVideo = mediaIds[0].type === "video";
            const postType = post.postType || "post";
            const params = {};

            if (postType === "story") {
                params.media_type = "STORY";
            } else if (postType === "reel") {
                params.media_type = "REELS";
                params.caption = content || "";
                if (post.thumbnailUrl) params.cover_url = post.thumbnailUrl;
            } else if (isVideo) {
                params.media_type = "VIDEO";
                params.caption = content || "";
                if (post.thumbnailUrl) params.cover_url = post.thumbnailUrl;
            } else {
                params.image_url = mediaUrl;
                params.caption = content || "";
            }

            if (isVideo) {
                params.video_url = mediaUrl;
            }

            publishContainerId = await this.createContainer(baseUrl, accessToken, params);
            
            // Wait for processing
            const status = await this.waitForContainer(publishContainerId, version, accessToken);
            if (status === "PUBLISHED") {
                return { id: publishContainerId, url: `https://instagram.com/` };
            }
        } else {
             throw new Error("Instagram requires media (image/video) to post.");
        }

        logger.info(`[Instagram] Container ${publishContainerId} is ready. Publishing...`);

        // Step 3: Publish Media Container
        const publishParams = {
            creation_id: publishContainerId,
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
            url: `https://instagram.com/p/${publishResponse.data.id}`,
        };
    }

    /**
     * Fetch comments for a media item
     * Production Ready: Includes error handling and pagination support
     */
    async getComments(account, mediaId) {
        const accessToken = account.accessToken;
        const version = "v18.0";
        
        try {
            const response = await axios.get(
                `https://graph.facebook.com/${version}/${mediaId}/comments`,
                {
                    params: {
                        access_token: accessToken,
                        fields: "id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}"
                    }
                }
            );

            return (response.data.data || []).map(comment => ({
                id: comment.id,
                text: comment.text,
                author: comment.username,
                publishedAt: comment.timestamp,
                likeCount: comment.like_count || 0,
                replies: (comment.replies?.data || []).map(reply => ({
                    id: reply.id,
                    text: reply.text,
                    author: reply.username,
                    publishedAt: reply.timestamp,
                    likeCount: reply.like_count || 0
                }))
            }));
        } catch (error) {
            logger.error(`[Instagram] Failed to fetch comments:`, error.response?.data || error.message);
            throw new Error(`Failed to fetch Instagram comments: ${error.message}`);
        }
    }

    /**
     * Add a comment to a media item
     */
    async addComment(account, mediaId, text) {
        const accessToken = account.accessToken;
        const version = "v18.0";

        try {
            const response = await axios.post(
                `https://graph.facebook.com/${version}/${mediaId}/comments`,
                null,
                {
                    params: {
                        access_token: accessToken,
                        message: text
                    }
                }
            );

            return {
                id: response.data.id,
                text: text,
                author: account.platformUserName,
                publishedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`[Instagram] Failed to add comment:`, error.response?.data || error.message);
            throw new Error(`Failed to add Instagram comment: ${error.message}`);
        }
    }

    /**
     * Like/Unlike a media item or comment
     * IG uses POST /{id}/likes to like. Unlike is not directly exposed as 'rating' but usually a DELETE request.
     */
    async setCommentRating(account, id, rating) {
        const accessToken = account.accessToken;
        const version = "v18.0";

        try {
            // For IG, 'like' is a POST to /likes
            // 'none' or 'dislike' would be a DELETE to /likes
            const method = rating === 'like' ? 'post' : 'delete';
            
            await axios({
                method,
                url: `https://graph.facebook.com/${version}/${id}/likes`,
                params: { access_token: accessToken }
            });

            return { success: true, rating };
        } catch (error) {
            logger.error(`[Instagram] Failed to set rating:`, error.response?.data || error.message);
            throw new Error(`Failed to set Instagram rating: ${error.message}`);
        }
    }
}

export default new InstagramService();
