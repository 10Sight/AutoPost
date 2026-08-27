import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";

// Single source of truth for platform branding (icon + circular badge background)
// shared by dashboard widgets (PerformanceOverview, RecentActivity, ...).
export const PLATFORM_META = {
    facebook: { name: "Facebook", Icon: Facebook, bg: "bg-[#1877F2]" },
    instagram: { name: "Instagram", Icon: Instagram, bg: "bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5]" },
    x: { name: "Twitter / X", Icon: Twitter, bg: "bg-black dark:bg-gray-800" },
    linkedin: { name: "LinkedIn", Icon: Linkedin, bg: "bg-[#0A66C2]" },
    youtube: { name: "YouTube", Icon: Youtube, bg: "bg-[#FF0000]" },
};

export const PLATFORM_ORDER = ["facebook", "instagram", "x", "linkedin", "youtube"];
