import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import {
    Sparkles,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Clock,
    Check,
    X,
    FileText,
    RefreshCw,
    ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/platformMeta";

const STATUS_META = {
    posted: { label: "Posted", icon: CheckCircle2, className: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10" },
    published: { label: "Published", icon: CheckCircle2, className: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10" },
    failed: { label: "Failed", icon: AlertCircle, className: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10" },
    scheduled: { label: "Scheduled", icon: Clock, className: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10" },
    pending_approval: { label: "Pending Approval", icon: Clock, className: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-500/10" },
    approved: { label: "Approved", icon: Check, className: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10" },
    processing: { label: "Processing", icon: RefreshCw, className: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10" },
    rejected: { label: "Rejected", icon: X, className: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10" },
    cancelled: { label: "Cancelled", icon: X, className: "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800/60" },
    draft: { label: "Draft", icon: FileText, className: "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800/60" },
};
const DEFAULT_STATUS_CLASS = "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800/60";

const StatusPill = ({ status }) => {
    const meta = STATUS_META[status];
    const Icon = meta?.icon || Clock;
    const label = meta?.label || (status ? status.replace(/_/g, " ") : "Unknown");
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full capitalize whitespace-nowrap", meta?.className || DEFAULT_STATUS_CLASS)}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
};

const ActivityThumbnail = ({ post }) => {
    const platform = post.platform?.toLowerCase();
    const meta = PLATFORM_META[platform];
    const media = post.mediaIds?.[0] || post.mediaId || null;
    const thumbnailUrl = post.thumbnailUrl || (media?.type === "image" ? media.url : null);

    if (!meta) {
        return <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800" />;
    }

    const { Icon, bg } = meta;

    if (thumbnailUrl) {
        return (
            <div className="relative h-11 w-11 shrink-0">
                <img src={thumbnailUrl} alt="" className="h-11 w-11 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10" />
                <div className={cn("absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-950", bg)}>
                    <Icon className="h-2.5 w-2.5 text-white" />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("h-11 w-11 shrink-0 rounded-xl flex items-center justify-center", bg)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
    );
};

const ActivityRow = ({ post, onClick }) => {
    const meta = PLATFORM_META[post.platform?.toLowerCase()];
    const account = typeof post.socialAccountId === "object" ? post.socialAccountId : null;
    const accountName = account?.platformUserName || account?.channelTitle || meta?.name || "Personal Profile";

    return (
        <div
            onClick={() => onClick(post)}
            className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-900 hover:shadow-md hover:shadow-black/5 transition-all duration-300 cursor-pointer"
        >
            <ActivityThumbnail post={post} />

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{accountName}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mt-0.5 font-medium">
                            {post.caption || "Untitled Post"}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <StatusPill status={post.status} />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-400">
                    <span>{format(new Date(post.scheduledAt), "MMM d, h:mm a")}</span>
                    {post.updatedAt && (
                        <>
                            <span>•</span>
                            <span>Updated {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}</span>
                        </>
                    )}
                </div>
            </div>

            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-700 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
        </div>
    );
};

const RecentActivitySkeleton = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-2 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Loading activity...</p>
    </div>
);

const RecentActivityEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <Calendar className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No recent activity</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4 max-w-[200px]">
            Scheduled posts will appear here.
        </p>
        <Button size="sm" variant="outline" asChild>
            <Link to="/dashboard/create">Schedule a Post</Link>
        </Button>
    </div>
);

const resolveAccountId = (socialAccountId) =>
    typeof socialAccountId === "object" && socialAccountId ? socialAccountId._id : socialAccountId;

const RecentActivity = ({ posts = [], isLoading = false }) => {
    const navigate = useNavigate();

    const handleRowClick = (post) => {
        if (post.status === "posted" || post.status === "published") {
            navigate(`/dashboard/engagement/${post._id}`);
            return;
        }

        const initialData = {
            socialAccountId: resolveAccountId(post.socialAccountId),
            mediaId: post.mediaId,
            caption: post.caption,
            scheduledAt: post.scheduledAt,
            platform: post.platform,
        };

        if (post.status === "failed") {
            navigate("/dashboard/create", { state: { initialData } });
            return;
        }

        navigate("/dashboard/create", { state: { initialData, isEditing: true, postId: post._id } });
    };

    return (
        <Card className="border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        Recent Activity
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-muted-foreground hover:text-primary">
                        <Link to="/dashboard/scheduler" className="flex items-center gap-1">
                            View All
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
                <CardDescription>
                    Status updates on your latest scheduled posts.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-[350px] pr-4 -mr-4">
                    <div className="space-y-3 pr-4">
                        {isLoading ? (
                            <RecentActivitySkeleton />
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                <ActivityRow key={post._id} post={post} onClick={handleRowClick} />
                            ))
                        ) : (
                            <RecentActivityEmpty />
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default RecentActivity;
