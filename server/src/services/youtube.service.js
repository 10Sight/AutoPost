import { google } from "googleapis";
import PlatformService from "./platform.service.js";
import { logger } from "../utils/logger.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import axios from "axios";
import { Readable } from "stream";
import { SystemSettings } from "../models/systemSettings.model.js";
import { Usage } from "../models/usage.model.js";
import { ApiError } from "../utils/ApiError.js";
import { config } from "../config/env.config.js";

class YouTubeService extends PlatformService {
    getOAuthClient() {
        return new google.auth.OAuth2(
            config.GOOGLE_CLIENT_ID,
            config.GOOGLE_CLIENT_SECRET,
            config.GOOGLE_REDIRECT_URI
        );
    }

    async refreshAccessToken(account) {
        if (!account.refreshToken) {
            throw new Error("No refresh token available for YouTube account.");
        }

        const oauth2Client = this.getOAuthClient();
        oauth2Client.setCredentials({
            refresh_token: account.refreshToken,
        });

        try {
            const { credentials } = await oauth2Client.refreshAccessToken();

            // Update account in database
            account.accessToken = credentials.access_token;
            if (credentials.expiry_date) {
                account.expiresAt = new Date(credentials.expiry_date);
            }
            await account.save();

            logger.info(`[YouTube] Successfully refreshed access token for account: ${account.platformUserName}`);
            return credentials.access_token;
        } catch (error) {
            logger.error(`[YouTube] Failed to refresh access token:`, error);
            throw new Error("YouTube authentication expired. Please reconnect your account.");
        }
    }

    async checkQuotaAvailability(organizationId, unitsRequired) {
        // 1. Check Global Quota
        const globalSettings = await SystemSettings.getSettings();
        if (globalSettings.youtubeQuotaUsed + unitsRequired > globalSettings.youtubeQuotaLimit) {
            logger.error(`[YouTube] Global quota exceeded. Current: ${globalSettings.youtubeQuotaUsed}, Limit: ${globalSettings.youtubeQuotaLimit}`);
            throw new ApiError(403, "The application has reached its daily YouTube upload limit. Please try again tomorrow.");
        }

        // 2. Check Organization Quota
        const orgUsage = await Usage.findOne({ organizationId });
        if (orgUsage && orgUsage.youtubeQuotaUsed + unitsRequired > orgUsage.youtubeQuotaLimit) {
            logger.error(`[YouTube] Organization ${organizationId} quota exceeded. Current: ${orgUsage.youtubeQuotaUsed}, Limit: ${orgUsage.youtubeQuotaLimit}`);
            throw new ApiError(403, "Your organization has reached its daily YouTube upload limit. Please contact support or try again tomorrow.");
        }

        return { globalSettings, orgUsage };
    }

    async consumeQuota(organizationId, units) {
        // Increment global usage
        await SystemSettings.findOneAndUpdate(
            { key: "global_settings" },
            { $inc: { youtubeQuotaUsed: units } }
        );

        // Increment organization usage
        await Usage.findOneAndUpdate(
            { organizationId },
            { $inc: { youtubeQuotaUsed: units } },
            { upsert: true }
        );

        logger.info(`[YouTube] Consumed ${units} quota units for Org: ${organizationId}`);
    }

    async postContent(account, post) {
        const { caption: content, mediaId: media, youtubePrivacyStatus, youtubeTags, youtubeCategoryId, youtubeThumbnailUrl, publishAt, platformPostId } = post;
        const mediaUrl = media ? media.url : null;

        if (!mediaUrl) {
            throw new Error("YouTube requires a video for posting.");
        }

        // Idempotency check: If already posted, return existing ID
        if (platformPostId) {
            logger.info(`[YouTube] Post ${post._id} already has platformPostId ${platformPostId}. Returning existing.`);
            return { id: platformPostId, url: `https://www.youtube.com/watch?v=${platformPostId}` };
        }

        // Check if token is expired or close to expiring (within 5 minutes)
        const isExpired = account.expiresAt && (new Date(account.expiresAt).getTime() - Date.now() < 5 * 60 * 1000);

        let currentAccessToken = account.accessToken;
        if (isExpired && account.refreshToken) {
            logger.info(`[YouTube] Token expired or expiring soon, refreshing...`);
            currentAccessToken = await this.refreshAccessToken(account);
        }

        const auth = this.getOAuthClient();
        auth.setCredentials({ access_token: currentAccessToken });

        const youtube = google.youtube({
            version: "v3",
            auth,
        });

        // QUOTA CHECK: Video insert costs 1600 units
        const unitsRequired = 1600;
        await this.checkQuotaAvailability(post.organizationId, unitsRequired);

        logger.info(`[YouTube] Starting resumable upload for account: ${account.platformUserName || account.platformUserId}`);

        const lines = content.split("\n");
        const title = lines[0].substring(0, 100) || "Untitled Video";
        const description = lines.slice(1).join("\n") || content;

        try {
            // Fetch the video stream
            const response = await axios.get(mediaUrl, { responseType: "stream" });

            // Prepare metadata
            const requestBody = {
                snippet: {
                    title: title,
                    description: description,
                    tags: youtubeTags?.length > 0 ? youtubeTags : ["AutoPost", "SocialMedia"],
                    categoryId: youtubeCategoryId || "22", // Default to People & Blogs (22) if not specified
                },
                status: {
                    privacyStatus: youtubePrivacyStatus || "public",
                    selfDeclaredMadeForKids: false,
                },
            };

            // Add scheduling if publishAt is set and privacy is private/unlisted (YouTube requirements for scheduling)
            if (publishAt && (youtubePrivacyStatus === "private" || youtubePrivacyStatus === "unlisted")) {
                requestBody.status.publishAt = new Date(publishAt).toISOString();
                logger.info(`[YouTube] Scheduling video for ${requestBody.status.publishAt}`);
            }

            // Perform resumable upload
            const res = await youtube.videos.insert({
                part: "snippet,status",
                requestBody,
                media: {
                    body: response.data,
                },
            }, {
                // Support retries and resumable uploads configuration if needed
                // The library handles basic stream upload as resumable if it can
                onUploadProgress: (evt) => {
                    const progress = (evt.bytesRead / 1024 / 1024).toFixed(2);
                    logger.debug(`[YouTube] Upload Progress: ${progress} MB`);
                }
            });

            const videoId = res.data.id;
            logger.info(`[YouTube] Video uploaded successfully. ID: ${videoId}`);

            // Emit Audit Event: Uploaded
            const { eventBus } = await import("../utils/eventBus.js");
            const { EVENTS } = await import("../events/events.js");

            eventBus.emit(EVENTS.YOUTUBE_VIDEO_UPLOADED, {
                userId: post.userId,
                organizationId: post.organizationId,
                postId: post._id,
                platform: "youtube",
                videoId: videoId,
                title: title
            });

            if (requestBody.status.privacyStatus === 'public') {
                eventBus.emit(EVENTS.YOUTUBE_VIDEO_PUBLISHED, {
                    userId: post.userId,
                    organizationId: post.organizationId,
                    postId: post._id,
                    platform: "youtube",
                    videoId: videoId,
                    title: title
                });
            }

            // CONSUME QUOTA for video
            await this.consumeQuota(post.organizationId, unitsRequired);

            // Handle custom thumbnail if provided (Costs 50 units)
            if (youtubeThumbnailUrl && videoId) {
                try {
                    // Check quota for thumbnail
                    await this.checkQuotaAvailability(post.organizationId, 50);

                    logger.info(`[YouTube] Uploading custom thumbnail from ${youtubeThumbnailUrl}`);
                    const thumbResponse = await axios.get(youtubeThumbnailUrl, { responseType: "stream" });
                    await youtube.thumbnails.set({
                        videoId: videoId,
                        media: {
                            mimeType: "image/jpeg",
                            body: thumbResponse.data,
                        },
                    });

                    // Consume quota for thumbnail
                    await this.consumeQuota(post.organizationId, 50);

                    logger.info(`[YouTube] Custom thumbnail uploaded successfully for ${videoId}`);
                } catch (thumbError) {
                    logger.warn(`[YouTube] Failed to upload custom thumbnail for ${videoId}:`, thumbError.message);
                    // Don't fail the whole post if thumbnail fails
                }
            }

            return {
                id: videoId,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                status: res.data.status?.uploadStatus || "uploaded"
            };

        } catch (error) {
            // Handle automatic refresh on 401 Unauthorized
            if (error.code === 401 && account.refreshToken) {
                logger.warn(`[YouTube] 401 Unauthorized received, attempting token refresh and retry...`);
                await this.refreshAccessToken(account);
                return this.postContent(account, post);
            }

            logger.error(`[YouTube] API Error:`, error);
            const errorMessage = error.response?.data?.error?.message || error.message;

            // Emit Audit Event: Failed
            const { eventBus } = await import("../utils/eventBus.js");
            const { EVENTS } = await import("../events/events.js");

            eventBus.emit(EVENTS.YOUTUBE_UPLOAD_FAILED, {
                userId: post.userId,
                organizationId: post.organizationId,
                postId: post._id,
                platform: "youtube",
                error: errorMessage
            });

            throw new Error(`YouTube Upload Failed: ${errorMessage}`);
        }
    }

    async validateToken(token) {
        try {
            const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
            return !!response.data.aud;
        } catch (error) {
            return false;
        }
    }
}

export default new YouTubeService();
