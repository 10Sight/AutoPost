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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import PostDetailsModal from "./PostDetailsModal";
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

const PostCard = ({ post, onDelete, onStatusUpdate, canApprove, canSchedule }) => {
    const navigate = useNavigate();
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

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

    return (
        <>
            <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 group bg-white dark:bg-gray-900">
                {/* Header */}
                <div className="p-3 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setIsDetailsOpen(true)}
                    >
                        <Avatar className="h-8 w-8 ring-2 ring-gray-100 dark:ring-gray-800">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.socialAccount?.platformUserName || 'User')}&background=random`} />
                            <AvatarFallback>{post.socialAccount?.platformUserName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none">
                                    {post.socialAccount?.platformUserName || 'Unknown User'}
                                </span>
                                {post.platform === 'youtube' && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-red-100 text-red-600 border-red-200">YT</Badge>
                                )}
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium capitalize mt-0.5 flex items-center gap-1">
                                {post.platform}
                                {post.youtubePrivacyStatus && (
                                    <span className="lowercase text-[9px] opacity-60">• {post.youtubePrivacyStatus}</span>
                                )}
                            </span>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                                View Details
                            </DropdownMenuItem>
                            {post.status !== "published" && (
                                <DropdownMenuItem onClick={handleEdit}>
                                    Edit Post
                                </DropdownMenuItem>
                            )}
                            {post.status === "failed" && (
                                <DropdownMenuItem onClick={handleRetry}>
                                    Retry Post
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onDelete(post._id)}
                                className="text-red-600 focus:text-red-600"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Media/Content Area */}
                <div
                    className="aspect-square w-full bg-gray-50 dark:bg-gray-950 relative overflow-hidden flex items-center justify-center cursor-pointer"
                    onClick={() => setIsDetailsOpen(true)}
                >
                    {(post.media || post.mediaId) ? (
                        (post.media || post.mediaId).type === 'video' ? (
                            <video src={(post.media || post.mediaId).url} className="w-full h-full object-cover" />
                        ) : (
                            <img
                                src={(post.media || post.mediaId).url}
                                alt="Post media"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                            <X className="h-12 w-12 opacity-20" />
                        </div>
                    )}

                    {/* Status Overlay */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {getStatusIndicator(post.status)}

                        {/* Retry Indicator */}
                        {(post.retryCount > 0 || post.status === 'failed') && (
                            <div className="flex items-center gap-1">
                                {post.nextRetryAt && new Date(post.nextRetryAt) > new Date() && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] h-5 px-1.5 backdrop-blur-sm">
                                        <Clock className="w-3 h-3 mr-1 animate-pulse" />
                                        Retry in {format(new Date(post.nextRetryAt), "mm")}m
                                    </Badge>
                                )}

                                {post.retryCount > 0 && (
                                    <Badge variant="outline" className="bg-white/80 dark:bg-black/50 backdrop-blur-md text-[10px] h-5 px-1.5 border-gray-200 dark:border-gray-700">
                                        <RefreshCw className={cn("w-3 h-3 mr-1", post.status === 'pending' && post.retryCount > 0 ? "animate-spin-slow" : "")} />
                                        {post.retryCount}/{post.maxRetries}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Bar (Mock) */}
                <div className="px-3 py-2 flex items-center justify-between border-b border-gray-50 dark:border-gray-800/50">
                    <div className="flex items-center gap-4">
                        <Heart className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors cursor-pointer" />
                        <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors cursor-pointer" />
                        <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Approval Actions */}
                        {post.status === 'pending_approval' && canApprove && (
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 w-7 p-0 text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={(e) => { e.stopPropagation(); onStatusUpdate(post._id, 'approved'); }}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={(e) => { e.stopPropagation(); onStatusUpdate(post._id, 'rejected'); }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Caption */}
                <div className="px-3 pt-3 pb-4 cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 mr-2">
                            {post.socialAccount?.platformUserName || 'User'}
                        </span>
                        {post.caption || <span className="italic opacity-50">No caption</span>}
                    </p>
                    <div className="mt-2 text-[10px] text-gray-400 uppercase tracking-wider font-medium flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.scheduledAt), "MMM d, HH:mm")}
                    </div>
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
