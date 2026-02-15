export const PLATFORM_RULES = {
    instagram: {
        maxCharacters: 2200,
        maxHashtags: 30,
        hashtagRecommendation: 5,
        urlPolicy: "disallowed", // URLs in captions are not clickable
        emojiSupport: "full",
        emojiLimit: 30, // Instagram allows many but we suggest a limit
        mediaLimits: {
            images: 10,
            videos: 1
        },
        warnings: [
            "URLs in Instagram captions are not clickable.",
            "Captions over 125 characters are often truncated in the feed."
        ]
    },
    facebook: {
        maxCharacters: 63206,
        maxHashtags: Infinity,
        hashtagRecommendation: 2,
        urlPolicy: "allowed",
        emojiSupport: "full",
        emojiLimit: 50,
        warnings: [
            "Facebook posts perform better with a clear Call to Action at the end."
        ],
        mediaLimits: {
            images: 10,
            videos: 1
        }
    },
    twitter: {
        maxCharacters: 280,
        maxHashtags: Infinity,
        hashtagRecommendation: 2,
        urlPolicy: "allowed", // URLs count as 23 characters
        emojiSupport: "full",
        emojiLimit: 10,
        warnings: [
            "Twitter (X) threads are better for long-form content than a single long post."
        ],
        mediaLimits: {
            images: 4,
            videos: 1
        }
    },
    linkedin: {
        maxCharacters: 3000,
        maxHashtags: Infinity,
        hashtagRecommendation: 3,
        urlPolicy: "allowed",
        emojiSupport: "full",
        emojiLimit: 50,
        warnings: [
            "Use clear line breaks for readability on LinkedIn. Avoid 'wall of text'."
        ],
        mediaLimits: {
            images: 9,
            videos: 1
        }
    },
    youtube: {
        maxCharacters: 5000, // Description limit
        maxTitleCharacters: 100,
        maxTagsCount: 50,
        maxTagsChars: 500,
        maxHashtags: Infinity,
        hashtagRecommendation: 3,
        urlPolicy: "allowed",
        emojiSupport: "full",
        emojiLimit: 50,
        warnings: [
            "The first line of your caption will be used as the YouTube video title (max 100 characters).",
            "YouTube descriptions can be up to 5000 characters.",
            "Total length of all tags must be under 500 characters.",
            "YouTube requires a video; images will not be published."
        ],
        mediaLimits: {
            images: 0,
            videos: 1
        }
    }
};
