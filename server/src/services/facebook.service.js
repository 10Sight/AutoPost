import PlatformService from "./platform.service.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/env.config.js";
import axios from "axios";

class FacebookService extends PlatformService {
    async getAuthUrl(state) {
        const clientId = config.INSTAGRAM_CLIENT_ID;
        const redirectUri = `${config.BACKEND_URL}/api/v1/facebook/callback`;
        const scopes = [
            "pages_show_list",
            "pages_read_engagement",
            "instagram_basic",
            "instagram_content_publish",
            "public_profile"
        ];

        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes.join(",")}`;
    }

    async exchangeCodeForToken(code) {
        const clientId = config.INSTAGRAM_CLIENT_ID;
        const clientSecret = config.INSTAGRAM_CLIENT_SECRET;
        const redirectUri = `${config.BACKEND_URL}/api/v1/facebook/callback`;

        const response = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code: code
            }
        });

        return response.data;
    }

    async getLongLivedToken(shortLivedToken) {
        const clientId = config.INSTAGRAM_CLIENT_ID;
        const clientSecret = config.INSTAGRAM_CLIENT_SECRET;

        const response = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
                grant_type: "fb_exchange_token",
                client_id: clientId,
                client_secret: clientSecret,
                fb_exchange_token: shortLivedToken
            }
        });

        return response.data;
    }

    async getManageableAccounts(accessToken) {
        // 1. Get Facebook Pages
        const pagesRes = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
            params: {
                access_token: accessToken,
                fields: "name,id,access_token,picture,instagram_business_account{id,username,name,profile_picture_url}"
            }
        });

        const pages = pagesRes.data.data;
        const results = [];

        for (const page of pages) {
            // Add Facebook Page
            results.push({
                platform: "facebook",
                id: page.id,
                name: page.name,
                accessToken: page.access_token, // Page-specific token
                thumbnail: page.picture?.data?.url
            });

            // Add Linked Instagram Account if exists
            if (page.instagram_business_account) {
                const ig = page.instagram_business_account;
                results.push({
                    platform: "instagram",
                    id: ig.id,
                    name: ig.name || ig.username,
                    username: ig.username,
                    accessToken: page.access_token, // Instagram uses the Page's token
                    thumbnail: ig.profile_picture_url
                });
            }
        }

        return results;
    }

    async getProfileStats(accessToken, platformUserId, platform) {
        try {
            if (platform === "facebook") {
                const response = await axios.get(`https://graph.facebook.com/v18.0/${platformUserId}`, {
                    params: {
                        access_token: accessToken,
                        fields: "fan_count,name"
                    }
                });
                return {
                    follower_count: response.data.fan_count || 0,
                    reach: 0, // Reach usually comes from Insights API (more complex, using 0 for now)
                };
            } else if (platform === "instagram") {
                const response = await axios.get(`https://graph.facebook.com/v18.0/${platformUserId}`, {
                    params: {
                        access_token: accessToken,
                        fields: "followers_count,media_count,username"
                    }
                });
                return {
                    follower_count: response.data.followers_count || 0,
                    media_count: response.data.media_count || 0
                };
            }
            return {};
        } catch (error) {
            logger.error(`[Facebook] Failed to fetch stats for ${platformUserId}:`, error.response?.data || error.message);
            return {};
        }
    }

    async postContent(account, post) {
        // ... (existing postContent implementation)
        const { caption: content, mediaIds } = post;
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

        if (mediaIds && mediaIds.length > 1) {
            const isVideo = mediaIds[0].type === "video";
            if (isVideo) {
                 throw new Error("Facebook does not support multiple videos in a single feed post.");
            }
            
            const uploadedPhotoIds = [];
            for (let i = 0; i < mediaIds.length; i++) {
                 const m = mediaIds[i];
                 try {
                     const uploadRes = await axios.post(`${baseUrl}/photos`, null, { 
                         params: { access_token: accessToken, url: m.url, published: false } 
                     });
                     uploadedPhotoIds.push(uploadRes.data.id);
                 } catch (error) {
                     logger.error(`[Facebook] Failed to upload carousel photo ${i}:`, error.response?.data || error.message);
                 }
            }
            
            if (uploadedPhotoIds.length === 0) {
                 throw new Error("Failed to upload all Facebook carousel images.");
            }
            
            params.message = content || "";
            params.attached_media = JSON.stringify(uploadedPhotoIds.map(id => ({ media_fbid: id })));
            
        } else if (mediaIds && mediaIds.length === 1) {
            const mediaUrl = mediaIds[0].url;
            const isVideo = mediaIds[0].type === "video";
            const postType = post.postType || "post";

            if (postType === "story") {
                if (isVideo) {
                    endpoint = `https://graph.facebook.com/${version}/${pageId}/video_stories`;
                    params.video_url = mediaUrl;
                    delete params.message;
                } else {
                    endpoint = `https://graph.facebook.com/${version}/${pageId}/photo_stories`;
                    params.url = mediaUrl;
                    delete params.message;
                }
            } else if (isVideo) {
                endpoint = `https://graph-video.facebook.com/${version}/${pageId}/videos`;
                params.file_url = mediaUrl;
                params.description = content || "";
                if (post.thumbnailUrl) params.thumb = post.thumbnailUrl;
                delete params.message;
            } else {
                endpoint = `${baseUrl}/photos`;
                params.url = mediaUrl;
                params.caption = content || "";
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

    /**
     * Fetch comments for a Facebook post
     */
    async getComments(account, postId) {
        const accessToken = account.accessToken;
        const version = "v18.0";

        try {
            const response = await axios.get(
                `https://graph.facebook.com/${version}/${postId}/comments`,
                {
                    params: {
                        access_token: accessToken,
                        fields: "id,message,created_time,from,like_count,comment_count"
                    }
                }
            );

            return (response.data.data || []).map(comment => ({
                id: comment.id,
                text: comment.message,
                author: comment.from?.name || "Unknown",
                publishedAt: comment.created_time,
                likeCount: comment.like_count || 0,
                replyCount: comment.comment_count || 0
            }));
        } catch (error) {
            logger.error(`[Facebook] Failed to fetch comments:`, error.response?.data || error.message);
            throw new Error(`Failed to fetch Facebook comments: ${error.message}`);
        }
    }

    /**
     * Add a comment to a Facebook post
     */
    async addComment(account, postId, text) {
        const accessToken = account.accessToken;
        const version = "v18.0";

        try {
            const response = await axios.post(
                `https://graph.facebook.com/${version}/${postId}/comments`,
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
            logger.error(`[Facebook] Failed to add comment:`, error.response?.data || error.message);
            throw new Error(`Failed to add Facebook comment: ${error.message}`);
        }
    }

    /**
     * Like/Unlike a Facebook post or comment
     */
    async setCommentRating(account, id, rating) {
        const accessToken = account.accessToken;
        const version = "v18.0";

        try {
            // FB 'like' is POST to /likes. 'none' would be DELETE.
            const method = rating === 'like' ? 'post' : 'delete';

            await axios({
                method,
                url: `https://graph.facebook.com/${version}/${id}/likes`,
                params: { access_token: accessToken }
            });

            return { success: true, rating };
        } catch (error) {
            logger.error(`[Facebook] Failed to set rating:`, error.response?.data || error.message);
            throw new Error(`Failed to set Facebook rating: ${error.message}`);
        }
    }
}

export default new FacebookService();
