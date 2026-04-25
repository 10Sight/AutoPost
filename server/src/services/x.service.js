import PlatformService from "./platform.service.js";
import { logger } from "../utils/logger.js";
import { config } from "../config/env.config.js";
import { TwitterApi } from "twitter-api-v2";
import { SocialAccount } from "../models/socialAccount.model.js";
import axios from "axios";

class XService extends PlatformService {
    constructor() {
        super();
        this.clientId = config.X_CLIENT_ID;
        this.clientSecret = config.X_CLIENT_SECRET;
        
        const baseUrl = process.env.BACKEND_URL || `http://localhost:${config.PORT}`;
        this.callbackUrl = `${baseUrl}/api/v1/x/callback`;
    }

    getClient() {
        if (!this.clientId || !this.clientSecret) {
            throw new Error("X Client ID or Secret is not configured");
        }
        return new TwitterApi({
            clientId: this.clientId,
            clientSecret: this.clientSecret,
        });
    }

    getAuthUrl() {
        const client = this.getClient();
        // Generate auth URL with PKCE
        const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
            this.callbackUrl,
            { scope: ["tweet.read", "tweet.write", "users.read", "offline.access"] }
        );
        return { url, codeVerifier, state };
    }

    async exchangeCodeForToken(code, codeVerifier) {
        const client = this.getClient();
        try {
            const { client: loggedClient, accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
                code,
                codeVerifier,
                redirectUri: this.callbackUrl,
            });

            // Get user info with metrics
            const me = await loggedClient.v2.me({
                "user.fields": ["profile_image_url", "username", "public_metrics"]
            });

            return {
                accessToken,
                refreshToken,
                expiresIn,
                user: {
                    ...me.data,
                    statistics: me.data.public_metrics
                }
            };
        } catch (error) {
            logger.error(`[X] Error exchanging code for token: ${error.message}`);
            throw error;
        }
    }

    async getProfileStats(accessToken) {
        try {
            const client = new TwitterApi(accessToken);
            const me = await client.v2.me({
                "user.fields": ["public_metrics"]
            });
            return me.data.public_metrics || {};
        } catch (error) {
            logger.error(`[X] Failed to fetch profile stats: ${error.message}`);
            return {};
        }
    }

    async refreshTokenIfNeeded(account) {
        if (!account.refreshToken) return null;
        
        const isExpired = account.expiresAt && new Date() >= new Date(account.expiresAt.getTime() - 5 * 60000); // 5 mins buffer
        
        if (isExpired) {
            const client = this.getClient();
            try {
                const { client: refreshedClient, accessToken, refreshToken, expiresIn } = await client.refreshOAuth2Token(account.refreshToken);
                
                account.accessToken = accessToken;
                account.refreshToken = refreshToken;
                account.expiresAt = new Date(Date.now() + (expiresIn * 1000));
                await account.save();
                
                return refreshedClient;
            } catch (error) {
                logger.error(`[X] Failed to refresh token: ${error.message}`);
                throw new Error("X token expired and failed to refresh");
            }
        }
        
        return new TwitterApi(account.accessToken);
    }

    async postContent(account, post) {
        const { caption: content, mediaIds } = post;
        
        logger.info(`[X] Posting tweet for ${account.platformUserName}`);

        let tweetText = content || "";
        const uploadedMediaIds = [];

        try {
            const twitterClient = await this.refreshTokenIfNeeded(account) || new TwitterApi(account.accessToken);
            
            // Handle Media Uploads if any exist
            if (mediaIds && mediaIds.length > 0) {
                // X allows max 4 images
                const limit = Math.min(mediaIds.length, 4);
                
                for (let i = 0; i < limit; i++) {
                    const media = mediaIds[i];
                    try {
                        const response = await axios.get(media.url, { responseType: "arraybuffer" });
                        const buffer = Buffer.from(response.data);
                        let mimeType = 'image/jpeg';
                        if (media.type === 'video') mimeType = 'video/mp4';
                        else if (media.url.toLowerCase().endsWith('.png')) mimeType = 'image/png';
                        else if (media.url.toLowerCase().endsWith('.gif')) mimeType = 'image/gif';

                        const mediaIdStr = await twitterClient.v1.uploadMedia(buffer, { mimeType });
                        uploadedMediaIds.push(mediaIdStr);
                        logger.info(`[X] Successfully uploaded media ${i+1}/${limit} to X.`);
                    } catch (uploadError) {
                        logger.warn(`[X] Failed to upload media item ${i+1}: ${uploadError.message}`);
                    }
                }
            }

            const tweetPayload = { text: tweetText };
            if (uploadedMediaIds.length > 0) {
                tweetPayload.media = { media_ids: uploadedMediaIds };
            }

            const response = await twitterClient.v2.tweet(tweetPayload);

            if (!response || !response.data || !response.data.id) {
                throw new Error("Failed to post to X");
            }

            const tweetId = response.data.id;

            return {
                id: tweetId,
                url: `https://x.com/${account.platformUserName}/status/${tweetId}`,
            };
        } catch (error) {
            const apiDetails = error.data ? JSON.stringify(error.data) : "No details";
            logger.error(`[X] Error posting tweet: ${error.message} - ${apiDetails}`);
            throw error;
        }
    }

    /**
     * Fetch replies for a tweet
     * X doesn't have a direct 'getComments' endpoint in v2 without search or specialized access.
     * We'll use the search API to find replies mentioning the tweet ID.
     */
    async getComments(account, tweetId) {
        try {
            const twitterClient = await this.refreshTokenIfNeeded(account) || new TwitterApi(account.accessToken);
            
            // Search for tweets that are replies to this tweet
            const response = await twitterClient.v2.search(`conversation_id:${tweetId}`, {
                "tweet.fields": ["author_id", "created_at", "public_metrics"],
                expansions: ["author_id"],
                "user.fields": ["username", "name", "profile_image_url"]
            });

            const usersMap = new Map();
            if (response.includes?.users) {
                response.includes.users.forEach(user => usersMap.set(user.id, user));
            }

            return (response.data?.data || []).map(tweet => {
                const user = usersMap.get(tweet.author_id);
                return {
                    id: tweet.id,
                    text: tweet.text,
                    author: user?.username || "Unknown",
                    publishedAt: tweet.created_at,
                    likeCount: tweet.public_metrics?.like_count || 0,
                    replyCount: tweet.public_metrics?.reply_count || 0
                };
            });
        } catch (error) {
            logger.error(`[X] Failed to fetch comments: ${error.message}`);
            return []; // Return empty instead of throwing to avoid breaking UI
        }
    }

    /**
     * Reply to a tweet
     */
    async addComment(account, tweetId, text) {
        try {
            const twitterClient = await this.refreshTokenIfNeeded(account) || new TwitterApi(account.accessToken);
            
            const response = await twitterClient.v2.reply(text, tweetId);

            return {
                id: response.data.id,
                text: text,
                author: account.platformUserName,
                publishedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`[X] Failed to add comment: ${error.message}`);
            throw new Error(`Failed to add X reply: ${error.message}`);
        }
    }

    /**
     * Like/Unlike a tweet
     */
    async setCommentRating(account, id, rating) {
        try {
            const twitterClient = await this.refreshTokenIfNeeded(account) || new TwitterApi(account.accessToken);
            
            if (rating === 'like') {
                await twitterClient.v2.like(account.platformUserId, id);
            } else {
                await twitterClient.v2.unlike(account.platformUserId, id);
            }

            return { success: true, rating };
        } catch (error) {
            logger.error(`[X] Failed to set rating: ${error.message}`);
            throw new Error(`Failed to set X rating: ${error.message}`);
        }
    }
}

export default new XService();
