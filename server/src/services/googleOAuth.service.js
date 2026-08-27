import axios from "axios";
import { google } from "googleapis";
import { config } from "../config/env.config.js";
import { logger } from "../utils/logger.js";
import { Organization } from "../models/organization.model.js";

// The Gemini Developer API (generativelanguage.googleapis.com) only accepts OAuth
// bearer tokens carrying `cloud-platform` scope, and additionally requires an
// `x-goog-user-project` header naming a GCP project that has the Generative
// Language API enabled with billing — a plain `generative-language` scope (as
// used for the semantic-retrieval/tuning APIs) is rejected on generateContent
// with 403 ACCESS_TOKEN_SCOPE_INSUFFICIENT. This is why `projectId` is a required
// second input alongside the OAuth connection, not just cosmetic.
const GEMINI_OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
];

const GEMINI_REDIRECT_URI = config.GOOGLE_GEMINI_REDIRECT_URI
    || `${config.BACKEND_URL}/api/v1/organization/oauth/gemini/callback`;

const getGeminiOAuthClient = () => {
    return new google.auth.OAuth2(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        GEMINI_REDIRECT_URI
    );
};

const generateGeminiAuthUrl = (state) => {
    const oauth2Client = getGeminiOAuthClient();
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: GEMINI_OAUTH_SCOPES,
        state,
        prompt: "consent",
    });
};

const exchangeGeminiCodeForTokens = async (code) => {
    const oauth2Client = getGeminiOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

const fetchGoogleUserEmail = async (accessToken) => {
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 8000,
    });
    return response.data?.email || null;
};

/**
 * Returns a live Gemini OAuth access token + billed project id for an organization,
 * refreshing the stored access token first if it's expired or within 5 minutes of
 * expiring. Returns null if the org has no Gemini OAuth connection at all.
 */
const getOrRefreshGeminiAccessToken = async (organizationId) => {
    const organization = await Organization.findById(organizationId)
        .select("+aiOAuth.gemini.accessToken +aiOAuth.gemini.refreshToken +aiOAuth.gemini.expiryDate");

    const gemini = organization?.aiOAuth?.gemini;
    if (!gemini?.refreshToken) {
        return null;
    }

    const isExpired = gemini.expiryDate && (new Date(gemini.expiryDate).getTime() - Date.now() < 5 * 60 * 1000);

    if (!isExpired && gemini.accessToken) {
        return { accessToken: gemini.accessToken, projectId: gemini.projectId };
    }

    const oauth2Client = getGeminiOAuthClient();
    oauth2Client.setCredentials({ refresh_token: gemini.refreshToken });

    try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        organization.aiOAuth.gemini.accessToken = credentials.access_token;
        if (credentials.expiry_date) {
            organization.aiOAuth.gemini.expiryDate = new Date(credentials.expiry_date);
        }
        organization.markModified("aiOAuth");
        await organization.save();

        logger.info(`[Google OAuth] Refreshed Gemini access token for org: ${organizationId}`);
        return { accessToken: credentials.access_token, projectId: gemini.projectId };
    } catch (error) {
        logger.error(`[Google OAuth] Failed to refresh Gemini access token for org: ${organizationId}`, error.message);
        return null;
    }
};

export {
    GEMINI_OAUTH_SCOPES,
    getGeminiOAuthClient,
    generateGeminiAuthUrl,
    exchangeGeminiCodeForTokens,
    fetchGoogleUserEmail,
    getOrRefreshGeminiAccessToken,
};
