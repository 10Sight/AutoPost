import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";
import { resolveTheme } from "@/lib/colorTheme";

/**
 * `badge` is opt-in and caller-supplied (e.g. "5 connected") — it is never
 * auto-generated, so a card only shows a count when there's real data behind it.
 */
const QuickActionCard = ({ title, description, href, icon: Icon, accent, badge }) => {
    const theme = resolveTheme(accent);

    return (
        <Link to={href} className="block group">
            <Card className="relative overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 dark:backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div
                    className={cn(
                        "pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        theme.glow
                    )}
                />

                <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center transition-colors duration-300", theme.iconBg, theme.iconHoverBg)}>
                        <Icon className={cn("h-4 w-4 transition-colors duration-300 group-hover:text-white", theme.icon)} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-zinc-300 dark:text-zinc-700 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </CardHeader>

                <CardContent className="relative pt-0">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{title}</CardTitle>
                        {badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800/60 whitespace-nowrap">
                                {badge}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{description}</p>
                </CardContent>
            </Card>
        </Link>
    );
};

export default QuickActionCard;
