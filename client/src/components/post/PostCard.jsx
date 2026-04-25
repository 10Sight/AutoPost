import React from "react";
import { format } from "date-fns";
import {
    MoreHorizontal,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Check,
    X,
    Clock,
    Heart,
    MessageCircle,
    Share2,
    RefreshCw,
    Volume2,
    VolumeX,
    ChevronLeft,
    ChevronRight,
    Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import PostDetailsModal from "./PostDetailsModal";
import PostEngagementModal from "./PostEngagementModal";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";
import {
    Card,
} from "../ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
    YouTubePostCard,
    InstagramPostCard,
    LinkedInPostCard,
    XPostCard,
    FacebookPostCard,
    InstagramStoryCard,
    InstagramReelCard,
    YouTubeShortCard
} from "./PlatformPostCards";
import { useLikePostMutation } from "../../redux/slices/engagementApiSlice";
import { toast } from "sonner";

const PostCard = ({ post, onDelete, onStatusUpdate, canApprove, canSchedule }) => {
    const navigate = useNavigate();
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(true);
    const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
    const videoRef = React.useRef(null);
    const [likePost, { isLoading: isLiking }] = useLikePostMutation();

    const getStatusIndicator = (status) => {
        switch (status) {
            case "posted":
                return <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1" /> Posted</span>;
            case "failed":
                return <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3 mr-1" /> Failed</span>;
            case "pending":
            case "scheduled":
                return <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3 mr-1" /> Scheduled</span>;
            case "pending_approval":
                return <span className="flex items-center text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3 mr-1" /> Pending Approval</span>;
            case "approved":
                return <span className="flex items-center text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full"><Check className="w-3 h-3 mr-1" /> Approved</span>;
            default:
                return <span className="flex items-center text-xs font-medium text-gray-600 bg-gray-50 dark:bg-gray-900/20 px-2 py-0.5 rounded-full">{status}</span>;
        }
    };

    const handleRetry = () => {
        navigate("/dashboard/create", {
            state: {
                initialData: {
                    socialAccountId: post.socialAccountId,
                    mediaId: post.mediaId,
                    caption: post.caption,
                    scheduledAt: post.scheduledAt,
                    platform: post.platform
                }
            }
        });
    };

    const handleEdit = () => {
        navigate("/dashboard/create", {
            state: {
                initialData: {
                    socialAccountId: post.socialAccountId,
                    mediaId: post.mediaId,
                    caption: post.caption,
                    scheduledAt: post.scheduledAt,
                    platform: post.platform
                },
                isEditing: true,
                postId: post._id
            }
        });
    };

    const handleLike = async (e) => {
        if (e) e.stopPropagation();
        if (post.status !== "posted") return;
        try {
            await likePost({ postId: post._id, rating: "like" }).unwrap();
            toast.success("Post liked successfully!");
        } catch (error) {
            toast.error(error.data?.message || "Failed to like post");
        }
    };

    const handleComment = (e) => {
        if (e) e.stopPropagation();
        if (post.status === "posted") {
            navigate(`/dashboard/engagement/${post._id}`);
        }
    };

    const renderPlatformCard = () => {
        const commonProps = {
            post,
            isMuted,
            setIsMuted,
            currentMediaIndex,
            setCurrentMediaIndex,
            videoRef,
            onLike: handleLike,
            onComment: handleComment,
            isLiking
        };

        switch (post.platform.toLowerCase()) {
            case "youtube":
                if (post.postType === "short") return <YouTubeShortCard {...commonProps} />;
                return <YouTubePostCard {...commonProps} />;
            case "instagram":
                if (post.postType === "story") return <InstagramStoryCard {...commonProps} />;
                if (post.postType === "reel") return <InstagramReelCard {...commonProps} />;
                return <InstagramPostCard {...commonProps} />;
            case "linkedin":
                return <LinkedInPostCard {...commonProps} />;
            case "facebook":
                return <FacebookPostCard {...commonProps} />;
            case "x":
                return <XPostCard {...commonProps} />;
            default:
                return (
                    <div className="p-4 text-center text-slate-500">
                        Platform {post.platform} template coming soon
                    </div>
                );
        }
    };

    return (
        <>
            <Card className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500 group bg-white dark:bg-slate-900 rounded-2xl">
                {/* Global Status Bar (Unified for all platforms) */}
                <div className="px-4 py-2 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-2">
                        {getStatusIndicator(post.status)}
                        {post.status === 'pending' && post.retryCount > 0 && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] animate-pulse border-orange-200 text-orange-600 bg-orange-50">
                                Retrying {post.retryCount}/{post.maxRetries}
                            </Badge>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-full">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl border-slate-200 dark:border-slate-800">
                            <DropdownMenuItem onClick={() => setIsDetailsOpen(true)} className="rounded-lg gap-2">
                                <Eye className="w-4 h-4" /> View Details
                            </DropdownMenuItem>
                            {post.status === "posted" && (
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/engagement/${post._id}`)} className="rounded-lg gap-2 text-blue-600">
                                    <MessageCircle className="w-4 h-4" /> View Engagement
                                </DropdownMenuItem>
                            )}
                            {post.status !== "published" && post.status !== "posted" && (
                                <DropdownMenuItem onClick={handleEdit} className="rounded-lg gap-2">
                                    <RefreshCw className="w-4 h-4" /> Edit Post
                                </DropdownMenuItem>
                            )}
                            {post.status === "failed" && (
                                <DropdownMenuItem onClick={handleRetry} className="rounded-lg gap-2 text-orange-600">
                                    <RefreshCw className="w-4 h-4 animate-spin-slow" /> Retry Now
                                </DropdownMenuItem>
                            )}
                            <Separator className="my-1" />
                            <DropdownMenuItem
                                onClick={() => onDelete(post._id)}
                                className="text-red-600 focus:text-red-600 rounded-lg gap-2"
                            >
                                <X className="w-4 h-4" /> Delete Post
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Platform Specific Template Content */}
                <div className="cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
                    {renderPlatformCard()}
                </div>

                {/* Unified Footer Info */}
                <div className="px-4 py-3 bg-slate-50/30 dark:bg-slate-950/30 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(post.scheduledAt), "MMM d, HH:mm")}
                    </div>
                    {post.isEvergreen && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-[9px] h-5 px-1.5 font-bold">
                            EVERGREEN
                        </Badge>
                    )}
                </div>
            </Card>

            <PostDetailsModal
                post={post}
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onRollbackSuccess={() => {
                    // Background refresh handled by RTK Query invalidation
                }}
            />
        </>
    );
};

export default PostCard;
