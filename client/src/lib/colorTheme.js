// Every class string below is written out literally (never templated) so Tailwind's
// build-time scanner can find and generate it — dynamically composing class names
// like `bg-${accent}-500` would silently produce no CSS under Tailwind v4.
export const COLOR_THEMES = {
    blue: {
        iconBg: "bg-blue-50 dark:bg-blue-500/10",
        icon: "text-blue-600 dark:text-blue-400",
        iconHoverBg: "group-hover:bg-blue-600 dark:group-hover:bg-blue-500",
        glow: "from-blue-400/25",
    },
    purple: {
        iconBg: "bg-purple-50 dark:bg-purple-500/10",
        icon: "text-purple-600 dark:text-purple-400",
        iconHoverBg: "group-hover:bg-purple-600 dark:group-hover:bg-purple-500",
        glow: "from-purple-400/25",
    },
    orange: {
        iconBg: "bg-orange-50 dark:bg-orange-500/10",
        icon: "text-orange-600 dark:text-orange-400",
        iconHoverBg: "group-hover:bg-orange-600 dark:group-hover:bg-orange-500",
        glow: "from-orange-400/25",
    },
    green: {
        iconBg: "bg-green-50 dark:bg-green-500/10",
        icon: "text-green-600 dark:text-green-400",
        iconHoverBg: "group-hover:bg-green-600 dark:group-hover:bg-green-500",
        glow: "from-green-400/25",
    },
    pink: {
        iconBg: "bg-pink-50 dark:bg-pink-500/10",
        icon: "text-pink-600 dark:text-pink-400",
        iconHoverBg: "group-hover:bg-pink-600 dark:group-hover:bg-pink-500",
        glow: "from-pink-400/25",
    },
    red: {
        iconBg: "bg-red-50 dark:bg-red-500/10",
        icon: "text-red-600 dark:text-red-400",
        iconHoverBg: "group-hover:bg-red-600 dark:group-hover:bg-red-500",
        glow: "from-red-400/25",
    },
};
export const DEFAULT_THEME_KEY = "blue";

// Extracts an accent name (e.g. "blue") from a class string like
// "text-blue-600 dark:text-blue-400" and looks it up in COLOR_THEMES,
// falling back to the default theme when nothing recognizable is found.
export const resolveTheme = (colorClass = "") => {
    const match = colorClass.match(/text-([a-z]+)-\d{2,3}/);
    const key = match?.[1];
    return COLOR_THEMES[key] || COLOR_THEMES[DEFAULT_THEME_KEY];
};
