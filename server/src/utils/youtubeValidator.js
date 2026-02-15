/**
 * YouTube Metadata Validation Utility
 * Enforces YouTube Platform API limits
 */

export const validateYouTubeMetadata = (metadata) => {
    const { title, description, tags } = metadata;
    const errors = [];

    // Title Validation
    if (!title || title.trim().length === 0) {
        errors.push("Video title is required.");
    } else if (title.length > 100) {
        errors.push("Video title must not exceed 100 characters.");
    }

    // Description Validation
    if (description && description.length > 5000) {
        errors.push("Video description must not exceed 5000 characters.");
    }

    // Tags Validation
    if (tags && Array.isArray(tags)) {
        if (tags.length > 50) {
            errors.push("You cannot provide more than 50 tags.");
        }

        const totalTagsLength = tags.join(",").length;
        if (totalTagsLength > 500) {
            errors.push("Total tags content must not exceed 500 characters.");
        }

        // Individual tag validation
        const invalidTags = tags.filter(tag => tag.includes("<") || tag.includes(">"));
        if (invalidTags.length > 0) {
            errors.push("Tags cannot contain HTML/angle brackets.");
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
