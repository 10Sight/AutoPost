export const MEDIA_RULES = {
    instagram: {
        image: {
            allowedRatios: ["1:1", "4:5", "1.91:1"],
            maxSize: 8 * 1024 * 1024, // 8MB
            formats: ["jpg", "png", "jpeg"]
        },
        video: {
            maxDuration: 60, // seconds
            minDuration: 3,
            maxSize: 100 * 1024 * 1024, // 100MB
            allowedRatios: ["1:1", "4:5", "9:16"],
            formats: ["mp4", "mov"]
        }
    },
    facebook: {
        image: {
            allowedRatios: ["any"],
            maxSize: 30 * 1024 * 1024,
            formats: ["jpg", "png", "gif", "jpeg"]
        },
        video: {
            maxDuration: 14400, // 4 hours
            maxSize: 10 * 1024 * 1024 * 1024, // 10GB
            allowedRatios: ["any"],
            formats: ["mp4", "mov", "avi"]
        }
    },
    twitter: {
        image: {
            allowedRatios: ["any"],
            maxSize: 5 * 1024 * 1024,
            formats: ["jpg", "png", "webp"]
        },
        video: {
            maxDuration: 140, // 2 mins 20 secs
            maxSize: 512 * 1024 * 1024,
            allowedRatios: ["1:2.39", "2.39:1"],
            formats: ["mp4", "mov"]
        }
    },
    linkedin: {
        image: {
            allowedRatios: ["any"],
            maxSize: 5 * 1024 * 1024,
            formats: ["jpg", "png", "gif"]
        },
        video: {
            maxDuration: 600, // 10 minutes
            minDuration: 3,
            maxSize: 5 * 1024 * 1024 * 1024,
            allowedRatios: ["1:2.4", "2.4:1"],
            formats: ["mp4", "asf", "avi", "mov"]
        }
    },
    youtube: {
        video: {
            maxDuration: 43200, // 12 hours
            minDuration: 1,
            maxSize: 1024 * 1024 * 1024, // 1GB limit for our application quota safety
            allowedRatios: ["16:9", "9:16", "1:1"],
            formats: ["mp4", "mov", "avi", "wmv", "flv", "mkv", "webm"],
            intelligence: {
                preferredRatio: "16:9",
                minResolution: "1280x720", // HD
                audioRequired: true
            }
        }
    }
};

export const validateAspectRatio = (width, height, platform, type) => {
    const rules = MEDIA_RULES[platform]?.[type];
    if (!rules || rules.allowedRatios.includes("any")) return { isValid: true };

    const ratio = width / height;

    // Check common ratios with a small threshold for floating point errors
    const tolerance = 0.05;

    const matched = rules.allowedRatios.find(r => {
        const [w, h] = r.split(":").map(Number);
        const targetRatio = w / h;
        return Math.abs(ratio - targetRatio) < tolerance;
    });

    if (matched) return { isValid: true, matched };

    return {
        isValid: false,
        message: `Current aspect ratio (${ratio.toFixed(2)}) is not supported for ${platform}. Expected: ${rules.allowedRatios.join(", ")}`
    };
};
