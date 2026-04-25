import PlatformService from "./platform.service.js";
import { logger } from "../utils/logger.js";

import axios from "axios";

class LinkedInService extends PlatformService {
    constructor() {
        super();
        this.clientId = process.env.LINKEDIN_CLIENT_ID;
        this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        this.redirectUri = `${process.env.BACKEND_URL || "http://localhost:8000"}/api/v1/linkedin/callback`;
    }

    getAuthUrl(userId) {
        const scopes = [
            "openid",
            "profile",
            "email",
            "w_member_social", // Required for personal profile posting
        ];

        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            state: userId, // Pass user ID as state for security and context
            scope: scopes.join(" "),
        });

        return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }

    async exchangeCodeForToken(code) {
        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            client_secret: this.clientSecret,
        });

        const response = await axios.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            params.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        return response.data;
    }

    async getProfileInfo(accessToken) {
        const profileResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = profileResponse.data;
        return {
            id: `urn:li:person:${data.sub}`,
            name: data.name || `${data.given_name} ${data.family_name}`,
            email: data.email,
            picture: data.picture,
        };
    }

    async getManageablePages(accessToken) {
        try {
            // Step 1: Get ACLs (which organizations I can manage)
            const aclsResponse = await axios.get(
                "https://api.linkedin.com/v2/organizationAcls",
                {
                    params: {
                        q: "roleAssignee",
                        state: "APPROVED",
                    },
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                }
            );

            const organizationUrns = aclsResponse.data.elements.map(e => e.organization);
            if (organizationUrns.length === 0) return [];

            // Step 2: Get organization details (names/logos)
            const orgIds = organizationUrns.map(urn => urn.split(':').pop()).join(',');
            const orgsResponse = await axios.get(
                "https://api.linkedin.com/v2/organizations",
                {
                    params: {
                        ids: orgIds,
                        fields: "id,localizedName,logoV2(original~:playableFields(data(downloadUrl)))"
                    },
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                }
            );

            return Object.values(orgsResponse.data.results || {}).map(org => ({
                id: `urn:li:organization:${org.id}`,
                name: org.localizedName,
                thumbnail: org.logoV2?.["original~"]?.playableFields?.data?.downloadUrl
            }));
        } catch (error) {
            logger.warn(`[LinkedIn] Failed to fetch manageable pages: ${error.message}`);
            return [];
        }
    }

    async registerAndUploadMedia(accessToken, platformUserId, mediaUrl, isVideo = false) {
        // Step 1: Register the upload
        const registerBody = {
            registerUploadRequest: {
                recipes: [isVideo ? "urn:li:digitalmediaRecipe:feedshare-video" : "urn:li:digitalmediaRecipe:feedshare-image"],
                owner: platformUserId,
                serviceRelationships: [
                    {
                        relationshipType: "OWNER",
                        identifier: "urn:li:userGeneratedContent",
                    },
                ],
            },
        };

        const registerResponse = await axios.post(
            "https://api.linkedin.com/v2/assets?action=registerUpload",
            registerBody,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "X-Restli-Protocol-Version": "2.0.0",
                    "LinkedIn-Version": "202401",
                },
            }
        );

        const uploadUrl = registerResponse.data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
        const assetId = registerResponse.data.value.asset;

        logger.info(`[LinkedIn] Asset registered: ${assetId}. Fetching media from Cloudinary...`);

        // Step 2: Download from Cloudinary and Upload to LinkedIn
        // Using responseType: 'arraybuffer' to handle binary data
        const mediaFileResponse = await axios.get(mediaUrl, { responseType: "arraybuffer" });
        
        logger.info(`[LinkedIn] Media downloaded, streaming to LinkedIn...`);

        const uploadHeaders = {
            "Content-Type": isVideo ? "video/mp4" : "image/jpeg",
        };
        
        // Videos SHOULD NOT have the Authorization header per LinkedIn docs (but images can/should)
        if (!isVideo) {
            uploadHeaders.Authorization = `Bearer ${accessToken}`;
        }

        await axios.put(uploadUrl, mediaFileResponse.data, {
            headers: uploadHeaders
        });

        logger.info(`[LinkedIn] Media stream complete. Polling for asset availability...`);

        // Step 3: Wait for asset to be AVAILABLE (Important to fix blank posts)
        let isAvailable = false;
        let pAttempts = 0;
        const maxPAttempts = 15;

        while (!isAvailable && pAttempts < maxPAttempts) {
            pAttempts++;
            await new Promise(r => setTimeout(r, 4000)); // Wait 4 seconds between checks

            try {
                const assetResponse = await axios.get(
                    `https://api.linkedin.com/v2/assets/${encodeURIComponent(assetId)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "X-Restli-Protocol-Version": "2.0.0",
                            "LinkedIn-Version": "202401",
                        },
                    }
                );

                const status = assetResponse.data.recipes?.[0]?.status;
                logger.debug(`[LinkedIn] Asset ${assetId} status: ${status}`);

                if (status === "AVAILABLE") {
                    isAvailable = true;
                }
            } catch (error) {
                logger.warn(`[LinkedIn] Error polling asset status: ${error.message}`);
            }
        }

        if (!isAvailable) {
            logger.warn(`[LinkedIn] Asset ${assetId} still not AVAILABLE after polling. Proceeding anyway, but post might be blank.`);
        }

        return assetId;
    }

    async getProfileStats(accessToken, platformUserId) {
        try {
            // Ensure platformUserId is a full URN
            const urn = platformUserId.startsWith('urn:li:') ? platformUserId : `urn:li:person:${platformUserId}`;
            
            // Determine edge type based on URN type
            let edgeType = "COMPANY_FOLLOWED_BY_MEMBER"; // Default for organizations
            if (urn.includes("urn:li:person:")) {
                edgeType = "MEMBER_FOLLOWED_BY_MEMBER";
            }

            logger.info(`[LinkedIn] Fetching stats for ${urn} using ${edgeType}`);

            const response = await axios.get(
                `https://api.linkedin.com/v2/networkSizes/${urn}?edgeType=${edgeType}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                }
            );

            return {
                followerCount: response.data.firstDegreeSize || 0,
                syncedAt: new Date().toISOString()
            };
        } catch (error) {
            const details = error.response ? JSON.stringify(error.response.data) : error.message;
            logger.warn(`[LinkedIn] Failed to fetch profile stats for ${platformUserId}: ${details}`);
            return { followerCount: 0, error: "API_RESTRICTED" };
        }
    }

    async getFollowerCount(accessToken, organizationUrn) {
        const stats = await this.getProfileStats(accessToken, organizationUrn);
        return stats.followerCount;
    }

    async postContent(account, post) {
        const { caption: content, mediaIds, thumbnailUrl } = post;
        const userId = account.platformUserId; 
        const accessToken = account.accessToken;
        const version = "v2";
        const baseUrl = `https://api.linkedin.com/${version}`;

        logger.info(`[LinkedIn] Processing post for ${userId}`);

        const assetUrns = [];
        let isVideo = false;
        let thumbnailUrn = null;

        if (mediaIds && mediaIds.length > 0) {
            isVideo = mediaIds[0].type === "video";
            
            for (let i = 0; i < mediaIds.length; i++) {
                const media = mediaIds[i];
                try {
                    const urn = await this.registerAndUploadMedia(accessToken, userId, media.url, isVideo);
                    if (urn) assetUrns.push(urn);
                } catch (error) {
                    logger.error(`[LinkedIn] Media processing failed for item ${i}:`, error.response?.data || error.message);
                    throw new Error(`LinkedIn Media Upload Failed: ${error.message}`);
                }
            }

            // Upload thumbnail if it's a video
            if (isVideo && thumbnailUrl) {
                try {
                    logger.info(`[LinkedIn] Uploading custom thumbnail for video...`);
                    thumbnailUrn = await this.registerAndUploadMedia(accessToken, userId, thumbnailUrl, false);
                } catch (error) {
                    logger.warn(`[LinkedIn] Thumbnail upload failed, proceeding without it:`, error.message);
                }
            }
        }

        const postBody = {
            author: userId,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: content,
                    },
                    shareMediaCategory: assetUrns.length > 0 ? (isVideo ? "VIDEO" : "IMAGE") : "NONE",
                },
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
        };

        if (assetUrns.length > 0) {
            postBody.specificContent["com.linkedin.ugc.ShareContent"].media = assetUrns.map((urn) => {
                const mediaObj = {
                    status: "READY",
                    description: { text: "Post Media" },
                    media: urn,
                    title: { text: "Shared Media" },
                };

                if (isVideo && thumbnailUrn) {
                    mediaObj.thumbnails = [{
                        resolvedThumbnail: thumbnailUrn
                    }];
                }

                return mediaObj;
            });
        }

        try {
            const response = await axios.post(`${baseUrl}/ugcPosts`, postBody, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "X-Restli-Protocol-Version": "2.0.0",
                    "LinkedIn-Version": "202401",
                },
            });

            if (!response.data || !response.data.id) {
                throw new Error("Failed to post to LinkedIn");
            }

            return {
                id: response.data.id,
                url: `https://www.linkedin.com/feed/update/${response.data.id}`,
            };
        } catch (error) {
            const errorDetails = error.response?.data;
            logger.error(`[LinkedIn] Post failed (422/Error):`, errorDetails || error.message);
            
            if (errorDetails?.message) {
                throw new Error(`LinkedIn Error: ${errorDetails.message}${errorDetails.serviceErrorCode ? ` (Code: ${errorDetails.serviceErrorCode})` : ""}`);
            }
            throw error;
        }
    }

    /**
     * Fetch comments for a LinkedIn post
     */
    async getComments(account, postId) {
        const accessToken = account.accessToken;
        // LinkedIn postId is often a URN like urn:li:ugcPost:123
        const encodedUrn = encodeURIComponent(postId);

        try {
            const response = await axios.get(
                `https://api.linkedin.com/v2/socialActions/${encodedUrn}/comments`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "X-Restli-Protocol-Version": "2.0.0"
                    }
                }
            );

            return (response.data.elements || []).map(comment => ({
                id: comment.id,
                text: comment.message?.text || "",
                author: comment.actor || "Unknown",
                publishedAt: new Date(comment.created?.time || Date.now()).toISOString(),
                likeCount: 0 // LinkedIn likes on comments are in separate endpoint
            }));
        } catch (error) {
            logger.error(`[LinkedIn] Failed to fetch comments:`, error.response?.data || error.message);
            throw new Error(`Failed to fetch LinkedIn comments: ${error.message}`);
        }
    }

    /**
     * Add a comment to a LinkedIn post
     */
    async addComment(account, postId, text) {
        const accessToken = account.accessToken;
        const encodedUrn = encodeURIComponent(postId);

        try {
            const body = {
                actor: account.platformUserId,
                message: { text },
                object: postId
            };

            const response = await axios.post(
                `https://api.linkedin.com/v2/socialActions/${encodedUrn}/comments`,
                body,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "X-Restli-Protocol-Version": "2.0.0"
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
            logger.error(`[LinkedIn] Failed to add comment:`, error.response?.data || error.message);
            throw new Error(`Failed to add LinkedIn comment: ${error.message}`);
        }
    }

    /**
     * Like/Unlike a LinkedIn post
     */
    async setCommentRating(account, id, rating) {
        const accessToken = account.accessToken;
        const encodedUrn = encodeURIComponent(id);

        try {
            if (rating === 'like') {
                const body = {
                    actor: account.platformUserId,
                    object: id,
                    reactionType: "LIKE"
                };

                await axios.post(
                    `https://api.linkedin.com/v2/socialActions/${encodedUrn}/reactions`,
                    body,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "X-Restli-Protocol-Version": "2.0.0"
                        }
                    }
                );
            } else {
                // To unlike, we'd need to find the specific reaction ID and DELETE it
                // For now, we'll focus on Liking
                logger.info(`[LinkedIn] Unlike requested for ${id} - Not yet implemented`);
            }

            return { success: true, rating };
        } catch (error) {
            logger.error(`[LinkedIn] Failed to set rating:`, error.response?.data || error.message);
            throw new Error(`Failed to set LinkedIn rating: ${error.message}`);
        }
    }
}

export default new LinkedInService();
