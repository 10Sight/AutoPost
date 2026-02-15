import PlatformService from "./platform.service.js";
import { logger } from "../utils/logger.js";

import axios from "axios";
import { config } from "../config/env.config.js";

class XService extends PlatformService {
    async postContent(account, post) {
        const { caption: content, mediaId: media } = post;
        const mediaUrl = media ? media.url : null;
        // NOTE: For X API v2, posting on behalf of a user requires OAuth 2.0 User Context.
        // The `accessToken` in `account` should be the user's OAuth 2.0 access token.

        logger.info(`[X] Posting tweet for ${account.platformUserName}`);

        const tweetBody = {
            text: content,
        };

        // TODO: Media upload for X API v2 is still done via v1.1 media/upload
        // This requires OAuth 1.0a usually, or the new simplified flow if supported.
        // For now, if a mediaUrl is present, we append it to the text as a link.
        // Real implementation would: 1. Upload to v1.1 2. Get media_id 3. Add to tweetBody.media.media_ids

        if (mediaUrl) {
            tweetBody.text += ` ${mediaUrl}`;
        }

        const response = await axios.post("https://api.twitter.com/2/tweets", tweetBody, {
            headers: {
                Authorization: `Bearer ${account.accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.data || !response.data.data || !response.data.data.id) {
            throw new Error("Failed to post to X");
        }

        const tweetId = response.data.data.id;

        return {
            id: tweetId,
            url: `https://x.com/user/status/${tweetId}`,
        };
    }
}

export default new XService();
