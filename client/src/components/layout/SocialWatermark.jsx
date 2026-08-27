import React from "react";
import { SOCIAL_ICONS } from "../../lib/socialIcons";

const [FACEBOOK, INSTAGRAM, X, LINKEDIN, YOUTUBE] = SOCIAL_ICONS;

// Scattered toward the edges so center-aligned hero text stays readable.
const HERO_PLACEMENTS = [
    { platform: FACEBOOK, top: "8%", left: "4%", size: 64, rotate: -14, anim: "animate-drift", delay: "0s" },
    { platform: INSTAGRAM, top: "16%", right: "6%", size: 54, rotate: 12, anim: "animate-drift", delay: "0.4s" },
    { platform: X, bottom: "20%", left: "7%", size: 46, rotate: 9, anim: "animate-drift", delay: "1.6s" },
    { platform: LINKEDIN, bottom: "10%", right: "9%", size: 70, rotate: -10, anim: "animate-drift", delay: "2.4s" },
    { platform: YOUTUBE, top: "56%", left: "1.5%", size: 40, rotate: 18, anim: "animate-drift", delay: "0.9s" },
];

// White silhouettes scattered diagonally across the gradient CTA panel.
const CTA_PLACEMENTS = [
    { platform: FACEBOOK, top: "-12%", left: "6%", size: 92, rotate: -12 },
    { platform: INSTAGRAM, bottom: "-18%", left: "22%", size: 68, rotate: 10 },
    { platform: X, top: "8%", right: "10%", size: 56, rotate: 14 },
    { platform: LINKEDIN, bottom: "-14%", right: "12%", size: 100, rotate: -8 },
    { platform: YOUTUBE, bottom: "4%", right: "34%", size: 48, rotate: 16 },
];

// Oversized marks anchored to the bottom edge, mostly cropped off-screen.
const FOOTER_PLACEMENTS = [
    { platform: FACEBOOK, bottom: "-32%", left: "3%", size: 130, rotate: -6 },
    { platform: INSTAGRAM, bottom: "-42%", left: "26%", size: 105, rotate: 8 },
    { platform: X, bottom: "-26%", left: "50%", size: 85, rotate: -10 },
    { platform: LINKEDIN, bottom: "-38%", left: "70%", size: 115, rotate: 6 },
    { platform: YOUTUBE, bottom: "-22%", left: "90%", size: 78, rotate: 14 },
];

const VARIANTS = {
    hero: {
        placements: HERO_PLACEMENTS,
        imgClass: "grayscale opacity-[0.07] dark:opacity-[0.12] dark:invert",
    },
    cta: {
        placements: CTA_PLACEMENTS,
        imgClass: "opacity-[0.14] brightness-0 invert",
    },
    footer: {
        placements: FOOTER_PLACEMENTS,
        imgClass: "grayscale opacity-[0.05] dark:opacity-[0.08] dark:invert",
    },
};

const SocialWatermark = ({ variant = "hero" }) => {
    const config = VARIANTS[variant];
    if (!config) return null;

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 hidden select-none overflow-hidden sm:block"
        >
            {config.placements.map(({ platform, size, rotate, anim, delay, ...position }, index) => (
                <img
                    key={`${platform.key}-${index}`}
                    src={platform.icon}
                    alt=""
                    className={`absolute object-contain ${config.imgClass} ${anim ?? ""}`}
                    style={{
                        ...position,
                        width: size,
                        height: size,
                        "--drift-rot": `${rotate}deg`,
                        transform: `rotate(${rotate}deg)`,
                        animationDelay: delay,
                    }}
                />
            ))}
        </div>
    );
};

export default SocialWatermark;
