import PlatformService from "./platform.service.js";
import { logger } from "../utils/logger.js";

import axios from "axios";

class LinkedInService extends PlatformService {
    async postContent(account, post) {
        const { caption: content, mediaId: media } = post;
        const mediaUrl = media ? media.url : null;
        const userId = account.platformUserId; // e.g., urn:li:person:123
        const accessToken = account.accessToken;
        const version = "v2";
        const baseUrl = `https://api.linkedin.com/${version}`;

        logger.info(`[LinkedIn] Posting to ${userId}`);

        const postBody = {
            author: userId,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: content,
                    },
                    shareMediaCategory: mediaUrl ? "ARTICLE" : "NONE",
                },
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
        };

        if (mediaUrl) {
            // For simplicity, treating media as an article URL share.
            // Real media upload is complex (Register -> Upload -> Verify -> Post).
            postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
                {
                    status: "READY",
                    description: { text: "Details" },
                    media: mediaUrl, // URL to the image/video
                    originalUrl: mediaUrl,
                    title: { text: "Shared Media" },
                },
            ];
        }

        const response = await axios.post(`${baseUrl}/ugcPosts`, postBody, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Restli-Protocol-Version": "2.0.0",
            },
        });

        if (!response.data || !response.data.id) {
            throw new Error("Failed to post to LinkedIn");
        }

        return {
            id: response.data.id,
            url: `https://www.linkedin.com/feed/update/${response.data.id}`,
        };
    }
}

export default new LinkedInService();
