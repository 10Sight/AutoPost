import React from "react";
import { Youtube, Users, Eye, PlaySquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

const YouTubeChannelCard = ({ account }) => {
    if (!account || account.platform !== "youtube") return null;

    const stats = account.metadata?.statistics || {};
    const subscribers = parseInt(stats.subscriberCount || 0);
    const views = parseInt(stats.viewCount || 0);
    const videos = parseInt(stats.videoCount || 0);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    return (
        <Card className="border-gray-200 dark:border-gray-800 shadow-md bg-gradient-to-br from-red-50/30 to-white dark:from-red-950/10 dark:to-gray-900 overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center">
                            <Youtube className="h-3 w-3 text-white" />
                        </div>
                        {account.channelTitle || "YouTube Channel"}
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px] bg-red-100/50 text-red-600 border-red-200">
                        Live Stats
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-red-100/50 dark:border-red-900/20">
                        <Users className="h-3 w-3 text-gray-400 mb-1" />
                        <span className="text-xs font-black text-gray-900 dark:text-gray-100">{formatNumber(subscribers)}</span>
                        <span className="text-[9px] text-gray-500 uppercase font-medium">Subs</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-red-100/50 dark:border-red-900/20">
                        <Eye className="h-3 w-3 text-gray-400 mb-1" />
                        <span className="text-xs font-black text-gray-900 dark:text-gray-100">{formatNumber(views)}</span>
                        <span className="text-[9px] text-gray-500 uppercase font-medium">Views</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-red-100/50 dark:border-red-900/20">
                        <PlaySquare className="h-3 w-3 text-gray-400 mb-1" />
                        <span className="text-xs font-black text-gray-900 dark:text-gray-100">{formatNumber(videos)}</span>
                        <span className="text-[9px] text-gray-500 uppercase font-medium">Videos</span>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                        Channel connected & syncing
                        <TrendingUp className="h-2 w-2" />
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};

export default YouTubeChannelCard;
