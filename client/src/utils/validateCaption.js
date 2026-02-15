import { PLATFORM_RULES } from "./platformRules";

export const validateCaption = (caption, platform) => {
    const rules = PLATFORM_RULES[platform] || PLATFORM_RULES.facebook;
    const errors = [];
    const warnings = [];

    // Character count check
    const charCount = caption.length;
    if (charCount > rules.maxCharacters) {
        errors.push(`Caption exceeds ${platform} limit of ${rules.maxCharacters} characters.`);
    }

    // Hashtag check
    const hashtags = caption.match(/#[a-z0-9_]+/gi) || [];
    if (hashtags.length > rules.maxHashtags) {
        errors.push(`${platform} allows a maximum of ${rules.maxHashtags} hashtags.`);
    } else if (hashtags.length > rules.hashtagRecommendation) {
        warnings.push(`It's recommended to use fewer than ${rules.hashtagRecommendation} hashtags on ${platform} for better engagement.`);
    }

    // URL check
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hasUrls = urlRegex.test(caption);
    if (hasUrls && rules.urlPolicy === "disallowed") {
        warnings.push(`URLs are not clickable in ${platform} captions.`);
    }

    // Twitter specific URL handling
    let twitterCount = charCount;
    if (platform === "twitter") {
        const urls = caption.match(urlRegex) || [];
        // Twitter counts all URLs as 23 characters regardless of actual length
        urls.forEach(url => {
            twitterCount = twitterCount - url.length + 23;
        });
        if (twitterCount > rules.maxCharacters) {
            errors.push(`Twitter specific character count (with URL normalization) exceeds 280 characters.`);
        }
    }

    // Emoji check
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    const emojis = caption.match(emojiRegex) || [];
    if (rules.emojiLimit && emojis.length > rules.emojiLimit) {
        warnings.push(`${platform} post has ${emojis.length} emojis. Consider reducing for better readability.`);
    }

    // Platforms like LinkedIn/Twitter prefer fewer emojis
    if (platform === 'linkedin' && emojis.length > 5) {
        warnings.push("Professional platforms like LinkedIn see better engagement with fewer than 5 emojis.");
    }

    // Platform-specific warnings from rules
    if (rules.warnings) {
        rules.warnings.forEach(w => warnings.push(w));
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        charCount: platform === "twitter" ? twitterCount : charCount,
        maxCharacters: rules.maxCharacters
    };
};
