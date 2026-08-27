import React from "react";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { resolveTheme } from "@/lib/colorTheme";

const TREND_STYLES = {
    up: { icon: ArrowUpRight, className: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10" },
    down: { icon: ArrowDownRight, className: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10" },
    neutral: { icon: Clock, className: "text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800/60" },
};

const TrendBadge = ({ trend }) => {
    const style = TREND_STYLES[trend.direction] || TREND_STYLES.neutral;
    const TrendIcon = style.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap", style.className)}>
            <TrendIcon className="h-3 w-3" />
            {trend.label}
        </span>
    );
};

/**
 * `trend` is opt-in and caller-supplied ({ label, direction: "up"|"down"|"neutral" }) —
 * it is never auto-generated from the title, so a card only shows a trend when the
 * caller actually has real data to back it.
 */
const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    iconColor = "text-[#2563eb]",
    trend = null,
    loading = false,
}) => {
    const theme = resolveTheme(iconColor);

    return (
        <Card className="group relative overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 dark:backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div
                className={cn(
                    "pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    theme.glow
                )}
            />

            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                    {title}
                </CardTitle>
                <div className={cn("h-9 w-9 rounded-2xl flex items-center justify-center transition-colors duration-300", theme.iconBg, theme.iconHoverBg)}>
                    <Icon className={cn("h-4 w-4 transition-colors duration-300 group-hover:text-white", theme.icon)} />
                </div>
            </CardHeader>

            <CardContent className="relative">
                {loading ? (
                    <div className="h-8 w-20 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                ) : (
                    <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </div>
                )}
                {(description || trend) && !loading && (
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                        {description && (
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{description}</p>
                        )}
                        {trend && <TrendBadge trend={trend} />}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default StatCard;
