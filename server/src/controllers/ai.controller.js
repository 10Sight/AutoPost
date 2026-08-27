import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AIJob } from "../models/aiJob.model.js";
import { Organization } from "../models/organization.model.js";
import {
    generateTextService,
    processAiJob
} from "../services/ai.service.js";
import { getOrRefreshGeminiAccessToken } from "../services/googleOAuth.service.js";
import { validateLimit } from "../services/usage.service.js";

const AI_KEYS_SELECT = "+aiKeys.gemini +aiKeys.openai +aiKeys.anthropic +aiKeys.runway";

/**
 * Loads the organization's decrypted BYOK keys plus a freshly-rotated Gemini OAuth
 * token (if connected) for internal use only. Never send this object (or the org
 * doc it's read from) back to the client.
 */
const loadOrgAiKeys = async (organizationId) => {
    const organization = await Organization.findById(organizationId).select(AI_KEYS_SELECT);
    const geminiOAuth = await getOrRefreshGeminiAccessToken(organizationId);
    return { ...(organization?.aiKeys || {}), geminiOAuth };
};

/**
 * Generates an AI-written post caption or description (Synchronous)
 */
const generateText = asyncHandler(async (req, res) => {
    const { prompt, tone, includeEmojis, hashtagCount, model } = req.body;

    if (!prompt) {
        throw new ApiError(400, "Prompt is required to generate description");
    }

    // Input Validation: Defend against long strings / memory overload
    if (prompt.length > 500) {
        throw new ApiError(400, "Prompt must be less than 500 characters");
    }

    // 1. Validate quota limit before making external API requests
    await validateLimit(req.user.organizationId, 'ai', 1);

    // 2. Call the requested model, using the org's BYOK keys where configured
    const apiKeyOverrides = await loadOrgAiKeys(req.user.organizationId);
    const generatedText = await generateTextService(
        prompt,
        tone,
        includeEmojis,
        hashtagCount,
        model,
        apiKeyOverrides
    );

    // 3. Increment the billing quota counter
    // Text generations are synchronous, so we increment immediately on successful response.
    const { updateUsage } = await import("../services/usage.service.js");
    await updateUsage(req.user.organizationId, 'ai', 1, 'inc');

    return res.status(200).json(
        new ApiResponse(200, { text: generatedText }, "AI Description generated successfully")
    );
});

/**
 * Triggers an Asynchronous Image Generation Job (Returns 202 Accepted)
 */
const generateImage = asyncHandler(async (req, res) => {
    const { prompt, style, aspectRatio } = req.body;

    if (!prompt) {
        throw new ApiError(400, "Prompt is required to generate an image");
    }

    if (prompt.length > 500) {
        throw new ApiError(400, "Prompt must be less than 500 characters");
    }

    // 1. Validate quota limit
    await validateLimit(req.user.organizationId, 'ai', 1);

    // 2. Create the Job document in database (forces status = 'pending')
    const job = await AIJob.create({
        userId: req.user._id,
        organizationId: req.user.organizationId,
        type: "image",
        status: "pending",
        prompt,
        style,
        aspectRatio
    });

    // 3. Spawns the background execution process as a non-blocking asynchronous task
    processAiJob(job._id).catch(err => {
        console.error(`[AI Controller] Background image job ${job._id} execution failed:`, err);
    });

    // 4. Return 202 Accepted immediately to prevent browser connection timeouts
    return res.status(202).json(
        new ApiResponse(202, { jobId: job._id }, "Image generation queued successfully in the background")
    );
});

/**
 * Triggers an Asynchronous Video Generation Job (Returns 202 Accepted)
 */
const generateVideo = asyncHandler(async (req, res) => {
    const { prompt, aspectRatio, duration } = req.body;

    if (!prompt) {
        throw new ApiError(400, "Prompt is required to generate a video");
    }

    if (prompt.length > 500) {
        throw new ApiError(400, "Prompt must be less than 500 characters");
    }

    // 1. Validate quota limit
    await validateLimit(req.user.organizationId, 'ai', 1);

    // 2. Create Mongoose AI Job
    const job = await AIJob.create({
        userId: req.user._id,
        organizationId: req.user.organizationId,
        type: "video",
        status: "pending",
        prompt,
        aspectRatio,
        duration: duration || 10
    });

    // 3. Spawns background process (non-blocking)
    processAiJob(job._id).catch(err => {
        console.error(`[AI Controller] Background video job ${job._id} execution failed:`, err);
    });

    // 4. Return 202 Accepted status
    return res.status(202).json(
        new ApiResponse(202, { jobId: job._id }, "Video generation queued successfully in the background")
    );
});

/**
 * Retrieves the status and completed results of a background AI Job (Polling)
 */
const getJobStatus = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const job = await AIJob.findById(jobId);

    if (!job) {
        throw new ApiError(404, "AI generation job not found");
    }

    // Critical Security Guardrail: Tenant Separation Enforcement
    if (String(job.organizationId) !== String(req.user.organizationId)) {
        throw new ApiError(403, "Access denied. This AI job belongs to another organization.");
    }

    return res.status(200).json(
        new ApiResponse(200, job, "AI Job status fetched successfully")
    );
});

export {
    generateText,
    generateImage,
    generateVideo,
    getJobStatus
};
