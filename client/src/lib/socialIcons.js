import facebookIcon from "../assets/Social/facebook-round-logo.svg";
import instagramIcon from "../assets/Social/instagram-2016-logo.svg";
import xIcon from "../assets/Social/X-logo.svg";
import linkedinIcon from "../assets/Social/linkedin-square-icon.svg";
import youtubeIcon from "../assets/Social/youtube-main-logo.svg";

// Single source of truth for the 5 brand marks (SVG asset + brand color)
// shared by PlatformHub, SocialWatermark, and the homepage marquee.
export const SOCIAL_ICONS = [
    { key: "facebook", name: "Facebook", icon: facebookIcon, color: "#1877F2", status: "Published" },
    { key: "instagram", name: "Instagram", icon: instagramIcon, color: "#D6249F", status: "Scheduled" },
    { key: "x", name: "X", icon: xIcon, color: "#111827", status: "Synced" },
    { key: "linkedin", name: "LinkedIn", icon: linkedinIcon, color: "#0A66C2", status: "Live" },
    { key: "youtube", name: "YouTube", icon: youtubeIcon, color: "#FF0000", status: "Trending" },
];
