import { PLATFORM_RULES } from "./platformRules";

/**
 * Validates media metadata against platform-specific rules.
 * @param {Object} media - The media object from the database/API.
 * @param {string} platform - The target platform (instagram, facebook, etc.)
 * @returns {Object} - { isValid: boolean, warnings: string[], errors: string[] }
 */
export const validateMediaForPlatform = (media, platform) => {
    if (!media || !platform) return { isValid: true, warnings: [], errors: [] };

    const rules = PLATFORM_RULES[platform];
    const results = { isValid: true, warnings: [], errors: [] };

    if (!rules) return results;

    const isVideo = media.type === "video";
    const mediaType = isVideo ? "video" : "image";
    const typeRules = rules.mediaLimits?.[mediaType === "video" ? "videos" : "images"]; // Note: pluralizing for PLATFORM_RULES consistency

    // 1. Duration Check (Videos)
    if (isVideo && media.duration) {
        // We'll need to define duration rules in PLATFORM_RULES or a separate config
        // For now, let's use some industry standards if not present
        const maxDuration = platform === 'instagram' ? 60 : platform === 'twitter' ? 140 : Infinity;
        if (media.duration > maxDuration) {
            results.errors.push(`Video is too long for ${platform} (${media.duration.toFixed(0)}s). Max allowed: ${maxDuration}s.`);
            results.isValid = false;
        }
    }

    // 2. Aspect Ratio Check
    if (media.width && media.height) {
        const ratio = media.width / media.height;
        const tolerance = 0.05;

        if (platform === 'instagram') {
            // Instagram: 1:1 (Square), 4:5 (Vertical), 1.91:1 (Landscape)
            const allowed = [1, 0.8, 1.91];
            const isMatch = allowed.some(r => Math.abs(ratio - r) < tolerance);
            if (!isMatch) {
                results.warnings.push(`Aspect ratio (${media.aspectRatio}) is not ideal for Instagram. It might be cropped or shown with borders.`);
            }
        } else if (platform === 'twitter') {
            // Twitter: 1:1 to 2:1 is safe, but wide is better
            if (ratio < 0.5 || ratio > 2.5) {
                results.warnings.push(`Aspect ratio is extreme for Twitter. It may not display correctly.`);
            }
        } else if (platform === 'youtube') {
            // YouTube: 16:9 is preferred, 9:16 is for Shorts
            const is169 = Math.abs(ratio - (16 / 9)) < tolerance;
            const is916 = Math.abs(ratio - (9 / 16)) < tolerance;

            if (!is169 && !is916) {
                results.warnings.push(`YouTube prefers 16:9 aspect ratio. Your video (${media.aspectRatio}) might have black bars.`);
            }

            // Resolution check
            if (media.height < 720) {
                results.warnings.push(`Low resolution detected (${media.width}x${media.height}). YouTube recommends at least 720p HD for best quality.`);
            }

            // Audio Presence (Cloudinary specific metadata check)
            if (media.metadata && media.metadata.is_audio === false) {
                results.warnings.push("No audio stream detected. Ensure this is intentional.");
            }
        }
    }

    // 3. File Size Check
    if (media.size) {
        const sizeMB = media.size / (1024 * 1024);
        const maxImageSize = platform === 'twitter' ? 5 : 8;
        const maxVideoSize = platform === 'youtube' ? 1024 : platform === 'instagram' ? 100 : 512;

        if (!isVideo && sizeMB > maxImageSize) {
            results.warnings.push(`Image size is large (${sizeMB.toFixed(1)}MB). Optimized size is under ${maxImageSize}MB.`);
        } else if (isVideo && sizeMB > maxVideoSize) {
            const limit = platform === 'youtube' ? '1GB' : `${maxVideoSize}MB`;
            const msg = `Video size (${sizeMB.toFixed(1)}MB) is near or exceeds ${platform} limit of ${limit}.`;
            if (sizeMB > maxVideoSize) {
                results.errors.push(msg);
                results.isValid = false;
            } else {
                results.warnings.push(msg);
            }
        }

        // Thumbnail size check for YouTube (custom thumbnails must be under 2MB)
        if (platform === 'youtube' && !isVideo && sizeMB > 2) {
            results.warnings.push(`YouTube custom thumbnails must be under 2MB. Current size: ${sizeMB.toFixed(1)}MB.`);
        }
    }

    return results;
};
