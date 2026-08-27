import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Organization } from "../models/organization.model.js";

const KEY_FIELDS = ["gemini", "openai", "anthropic", "runway"];
const AI_KEYS_SELECT = "+aiKeys.gemini +aiKeys.openai +aiKeys.anthropic +aiKeys.runway";

// Never return the raw org document here — aiKeys must only ever leave this
// controller as booleans, regardless of what the schema/select layer already guards.
const toKeyStatus = (aiKeys) => {
    const status = {};
    KEY_FIELDS.forEach((field) => {
        status[field] = Boolean(aiKeys?.[field]);
    });
    return status;
};

const getAiKeys = asyncHandler(async (req, res) => {
    const organization = await Organization.findById(req.user.organizationId).select(AI_KEYS_SELECT);

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    // Gemini OAuth ("Connect Google Account") status — non-secret fields only.
    // Token values themselves are select:false and never loaded here.
    const gemini = organization.aiOAuth?.gemini;
    const geminiOAuth = {
        connected: Boolean(gemini?.connectedAt),
        connectedEmail: gemini?.connectedEmail || null,
        connectedAt: gemini?.connectedAt || null,
        projectId: gemini?.projectId || "",
    };

    return res
        .status(200)
        .json(new ApiResponse(200, { ...toKeyStatus(organization.aiKeys), geminiOAuth }, "AI key status fetched successfully"));
});

const updateAiKeys = asyncHandler(async (req, res) => {
    const fieldsSent = KEY_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(req.body, field));

    if (fieldsSent.length === 0) {
        throw new ApiError(400, "No key fields provided");
    }

    // Load, assign, and .save() rather than findByIdAndUpdate($set) — direct document
    // assignment is the pattern we can be certain triggers the `encrypt` setter on
    // these nested paths. Relying on update-query setter semantics here isn't worth
    // the risk for fields that must never land in the database unencrypted.
    const organization = await Organization.findById(req.user.organizationId).select(AI_KEYS_SELECT);

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    if (!organization.aiKeys) {
        organization.aiKeys = {};
    }

    // Empty string clears the key; omitted fields are left untouched.
    fieldsSent.forEach((field) => {
        organization.aiKeys[field] = req.body[field] || "";
    });
    organization.markModified("aiKeys");

    await organization.save();

    return res
        .status(200)
        .json(new ApiResponse(200, toKeyStatus(organization.aiKeys), "AI keys updated successfully"));
});

export { getAiKeys, updateAiKeys };
