import React from "react";
import { 
    Instagram, 
    Facebook, 
    Linkedin, 
    Twitter, 
    Youtube, 
    Users, 
    Eye, 
    PlaySquare, 
    TrendingUp, 
    ExternalLink,
    Activity,
    MessageSquare,
    Heart
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Link } from "react-router-dom";

const SocialAccountStatCard = React.memo(({ account }) => {
    if (!account) return null;

    const { platform, platformUserName, metadata, channelTitle } = account;
    const stats = metadata?.statistics || {};
    
    // Config per platform
    const platformConfig = {
        instagram: {
            icon: <Instagram className="h-4 w-4 text-white" />,
            color: "from-pink-500 to-purple-600",
            lightColor: "bg-pink-50 dark:bg-pink-900/10",
            textColor: "text-pink-600 dark:text-pink-400",
            metrics: [
                { label: "Followers", value: stats.follower_count || 0, icon: <Users className="h-3 w-3" /> },
                { label: "Posts", value: stats.media_count || 0, icon: <Activity className="h-3 w-3" /> }
            ]
        },
        facebook: {
            icon: <Facebook className="h-4 w-4 text-white" />,
            color: "from-blue-600 to-blue-700",
            lightColor: "bg-blue-50 dark:bg-blue-900/10",
            textColor: "text-blue-600 dark:text-blue-400",
            metrics: [
                { label: "Followers", value: stats.follower_count || 0, icon: <Users className="h-3 w-3" /> },
                { label: "Reach", value: stats.reach || 0, icon: <TrendingUp className="h-3 w-3" /> }
            ]
        },
        linkedin: {
            icon: <Linkedin className="h-4 w-4 text-white" />,
            color: "from-[#0a66c2] to-[#004182]",
            lightColor: "bg-blue-50 dark:bg-blue-950/20",
            textColor: "text-[#0a66c2] dark:text-blue-400",
            metrics: [
                { label: "Followers", value: stats.followerCount || 0, icon: <Users className="h-3 w-3" /> },
                { label: "Updates", value: stats.updateCount || 0, icon: <Activity className="h-3 w-3" /> }
            ]
        },
        x: {
            icon: <Twitter className="h-4 w-4 text-white" />,
            color: "from-gray-800 to-black dark:from-gray-700 dark:to-gray-950",
            lightColor: "bg-gray-100 dark:bg-gray-800/40",
            textColor: "text-gray-900 dark:text-white",
            metrics: [
                { label: "Followers", value: stats.followers_count || 0, icon: <Users className="h-3 w-3" /> },
                { label: "Tweets", value: stats.tweet_count || 0, icon: <MessageSquare className="h-3 w-3" /> }
            ]
        },
        youtube: {
            icon: <Youtube className="h-4 w-4 text-white" />,
            color: "from-red-600 to-red-700",
            lightColor: "bg-red-50 dark:bg-red-900/10",
            textColor: "text-red-600 dark:text-red-400",
            metrics: [
                { label: "Subs", value: parseInt(stats.subscriberCount || 0), icon: <Users className="h-3 w-3" /> },
                { label: "Views", value: parseInt(stats.viewCount || 0), icon: <Eye className="h-3 w-3" /> },
                { label: "Videos", value: parseInt(stats.videoCount || 0), icon: <PlaySquare className="h-3 w-3" /> }
            ]
        }
    };

    const config = platformConfig[platform?.toLowerCase()] || platformConfig.x;

    const formatNumber = (num) => {
        if (!num) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    return (
        <Link to={`/dashboard/analytics/account/${account._id}`} className="block">
            <Card className="group relative border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 overflow-hidden bg-white/95 dark:bg-gray-950/95 cursor-pointer">
            {/* Subtle Brand Glow */}
            <div className={`absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br ${config.color} opacity-0 group-hover:opacity-10 blur-[60px] transition-opacity duration-700`} />
            
            {/* Platform Watermark */}
            <div className="absolute right-4 bottom-4 opacity-5 group-hover:opacity-10 transition-all duration-700 pointer-events-none transform rotate-12">
                {React.cloneElement(config.icon, { className: "h-24 w-24" })}
            </div>

            <CardContent className="p-5 relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${config.color} shadow-lg flex items-center justify-center transform group-hover:scale-105 transition-all duration-500`}>
                            {React.cloneElement(config.icon, { className: "h-5 w-5 text-white" })}
                        </div>
                        <div className="flex flex-col">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
                                {platformUserName || channelTitle || "Personal Profile"}
                                <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-semibold text-gray-500`}>{platform}</span>
                                <span className="h-0.5 w-0.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                                <span className="text-[10px] text-gray-400">Sync Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="relative">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-ping absolute inset-0 opacity-75" />
                            <div className="h-2 w-2 rounded-full bg-green-500 relative" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {config.metrics.map((metric, idx) => (
                        <div key={idx} className={`p-3.5 rounded-2xl ${config.lightColor} border border-transparent transition-all duration-500 group/metric bg-white/40 dark:bg-black/20`}>
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`${config.textColor} opacity-60 group-hover/metric:opacity-100 transition-opacity`}>
                                    {metric.icon}
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{metric.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-none">
                                    {formatNumber(metric.value)}
                                </span>
                                <TrendingUp className={`h-3 w-3 ${config.textColor} opacity-0 group-hover/metric:opacity-100 transition-opacity translate-y-[-1px]`} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                            <div className={`h-4 w-4 rounded-full bg-gradient-to-br ${config.color} border border-white dark:border-gray-950`} />
                            <div className="h-4 w-4 rounded-full bg-gray-100 dark:bg-gray-800 border border-white dark:border-gray-950" />
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">Real-time sync active</span>
                    </div>
                    <Badge variant="secondary" className="bg-gray-100/50 dark:bg-gray-800/50 text-[9px] font-semibold border-none py-0 px-2 opacity-60">
                        {stats ? 'v2.4' : 'v2.0'}
                    </Badge>
                </div>
            </CardContent>
        </Card>
        </Link>
    );
});

export default SocialAccountStatCard;
