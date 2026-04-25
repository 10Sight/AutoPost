import React from "react";
import { format } from "date-fns";
import { 
    ThumbsUp, 
    MessageCircle, 
    Eye, 
    Heart, 
    Share2, 
    Repeat, 
    UserPlus,
    MoreVertical,
    Volume2,
    VolumeX,
    ChevronLeft,
    ChevronRight,
    Play
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

/**
 * YouTube Specific Card
 */
export const YouTubePostCard = ({ post, isMuted, setIsMuted, currentMediaIndex, setCurrentMediaIndex, videoRef, onLike, onComment, isLiking }) => {
    const stats = post.analytics || {};
    
    return (
        <div className="flex flex-col gap-3">
            {/* Media Area - YouTube 16:9 Style */}
            <div className="aspect-video w-full bg-slate-900 relative group/media overflow-hidden rounded-xl">
                <MediaRenderer 
                    post={post} 
                    isMuted={isMuted} 
                    setIsMuted={setIsMuted}
                    currentMediaIndex={currentMediaIndex}
                    setCurrentMediaIndex={setCurrentMediaIndex}
                    videoRef={videoRef}
                />
            </div>

            {/* Info Area */}
            <div className="flex gap-3 px-1">
                <Avatar className="h-9 w-9 mt-0.5 border border-slate-100 dark:border-slate-800">
                    <AvatarImage src={post.socialAccountId?.thumbnail || post.socialAccountId?.avatar || post.socialAccountId?.picture || post.socialAccountId?.metadata?.picture || post.socialAccountId?.metadata?.thumbnail} />
                    <AvatarFallback>{post.socialAccountId?.displayName?.[0] || 'Y'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                        {post.caption || "Untitled Video"}
                    </h3>
                    <div className="flex flex-col mt-1">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                            {post.socialAccountId?.displayName || post.socialAccountId?.channelTitle}
                        </span>
                        <div className="flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400">
                            <span>{stats.views?.toLocaleString() || 0} views</span>
                            <span>•</span>
                            <span>{format(new Date(post.scheduledAt), "MMM d, yyyy")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 px-1 pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                <div 
                    className={cn(
                        "flex items-center gap-1.5 cursor-pointer transition-colors",
                        isLiking ? "opacity-50 pointer-events-none" : "hover:text-red-500 text-slate-600 dark:text-slate-400"
                    )}
                    onClick={onLike}
                >
                    <ThumbsUp className={cn("w-4 h-4", isLiking && "animate-pulse")} />
                    <span className="text-xs font-bold">{stats.likes?.toLocaleString() || 0}</span>
                </div>
                <div 
                    className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"
                    onClick={onComment}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">{stats.comments?.toLocaleString() || 0}</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Instagram Specific Card
 */
export const InstagramPostCard = ({ post, isMuted, setIsMuted, currentMediaIndex, setCurrentMediaIndex, videoRef, onLike, onComment, isLiking }) => {
    const stats = post.analytics || {};

    return (
        <div className="flex flex-col">
            {/* IG Header */}
            <div className="p-3 flex items-center gap-3">
                <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                    <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-900">
                        <AvatarImage src={post.socialAccountId?.thumbnail || post.socialAccountId?.avatar || post.socialAccountId?.picture || post.socialAccountId?.metadata?.picture || post.socialAccountId?.metadata?.thumbnail} />
                        <AvatarFallback>{post.socialAccountId?.displayName?.[0] || 'I'}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none hover:underline cursor-pointer">
                        {post.socialAccountId?.displayName || post.socialAccountId?.platformUserName}
                    </span>
                    {post.location && (
                        <span className="text-[10px] text-slate-500 mt-0.5">{post.location}</span>
                    )}
                </div>
                <MoreVertical className="w-4 h-4 text-slate-500 cursor-pointer" />
            </div>

            {/* IG Media - Aspect Square Style */}
            <div className="aspect-square w-full bg-slate-100 dark:bg-slate-950 relative group/media overflow-hidden">
                <MediaRenderer 
                    post={post} 
                    isMuted={isMuted} 
                    setIsMuted={setIsMuted}
                    currentMediaIndex={currentMediaIndex}
                    setCurrentMediaIndex={setCurrentMediaIndex}
                    videoRef={videoRef}
                />
            </div>

            <div className="p-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Heart 
                        className={cn(
                            "w-6 h-6 cursor-pointer transition-colors",
                            isLiking ? "text-red-300 animate-pulse" : "text-slate-800 dark:text-slate-200 hover:text-red-500"
                        )}
                        onClick={onLike}
                    />
                    <MessageCircle 
                        className="w-6 h-6 text-slate-800 dark:text-slate-200 hover:text-slate-500 transition-colors cursor-pointer" 
                        onClick={onComment}
                    />
                    <Share2 className="w-6 h-6 text-slate-800 dark:text-slate-200 hover:text-slate-500 transition-colors" />
                </div>
                <Badge variant="outline" className="border-slate-200 text-slate-400 text-[10px] h-5">IG</Badge>
            </div>

            {/* IG Caption */}
            <div className="px-3 pb-3">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {stats.likes?.toLocaleString() || 0} likes
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                    <span className="font-bold mr-2">{post.socialAccountId?.displayName || post.socialAccountId?.platformUserName}</span>
                    {post.caption}
                </p>
                <div className="mt-1 text-[10px] text-slate-400 uppercase">
                    {format(new Date(post.scheduledAt), "MMMM d")}
                </div>
            </div>
        </div>
    );
};

/**
 * X (Twitter) Specific Card
 */
export const XPostCard = ({ post, isMuted, setIsMuted, currentMediaIndex, setCurrentMediaIndex, videoRef, onLike, onComment, isLiking }) => {
    const stats = post.analytics || {};

    return (
        <div className="flex flex-col p-4 gap-3">
            <div className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={post.socialAccountId?.thumbnail || post.socialAccountId?.avatar || post.socialAccountId?.picture || post.socialAccountId?.metadata?.picture || post.socialAccountId?.metadata?.thumbnail} />
                    <AvatarFallback>{post.socialAccountId?.displayName?.[0] || 'X'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {post.socialAccountId?.displayName || post.socialAccountId?.platformUserName}
                        </span>
                        <span className="text-sm text-slate-500 truncate">
                            @{post.socialAccountId?.platformUserName || 'user'} • {format(new Date(post.scheduledAt), "MMM d")}
                        </span>
                    </div>
                    <p className="text-sm text-slate-900 dark:text-slate-100 mt-1 whitespace-pre-wrap leading-normal">
                        {post.caption}
                    </p>
                </div>
            </div>

            {/* X Media - Rounded & Bordered Style */}
            <div className="aspect-video w-full bg-slate-100 dark:bg-slate-950 relative group/media overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                <MediaRenderer 
                    post={post} 
                    isMuted={isMuted} 
                    setIsMuted={setIsMuted}
                    currentMediaIndex={currentMediaIndex}
                    setCurrentMediaIndex={setCurrentMediaIndex}
                    videoRef={videoRef}
                />
            </div>

            <div className="flex items-center justify-between text-slate-500 max-w-md px-1 pt-1">
                <div 
                    className="flex items-center gap-2 group/action cursor-pointer hover:text-blue-500 transition-colors"
                    onClick={onComment}
                >
                    <div className="p-2 rounded-full group-hover/action:bg-blue-50 dark:group-hover/action:bg-blue-900/20 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[13px]">{stats.comments || 0}</span>
                </div>
                <div className="flex items-center gap-2 group/action cursor-pointer hover:text-green-500">
                    <div className="p-2 rounded-full group-hover/action:bg-green-50 dark:group-hover/action:bg-green-900/20 transition-colors">
                        <Repeat className="w-4 h-4" />
                    </div>
                    <span className="text-[13px]">{stats.shares || 0}</span>
                </div>
                <div 
                    className={cn(
                        "flex items-center gap-2 group/action cursor-pointer transition-colors",
                        isLiking ? "text-pink-300" : "hover:text-pink-500"
                    )}
                    onClick={onLike}
                >
                    <div className="p-2 rounded-full group-hover/action:bg-pink-50 dark:group-hover/action:bg-pink-900/20 transition-colors">
                        <Heart className={cn("w-4 h-4", isLiking && "animate-pulse")} />
                    </div>
                    <span className="text-[13px]">{stats.likes || 0}</span>
                </div>
                <div className="flex items-center gap-2 group/action cursor-pointer hover:text-blue-500">
                    <div className="p-2 rounded-full group-hover/action:bg-blue-50 dark:group-hover/action:bg-blue-900/20 transition-colors">
                        <Eye className="w-4 h-4" />
                    </div>
                    <span className="text-[13px]">{stats.impressions || 0}</span>
                </div>
            </div>
        </div>
    );
};

/**
 * LinkedIn Specific Card
 */
export const LinkedInPostCard = ({ post, isMuted, setIsMuted, currentMediaIndex, setCurrentMediaIndex, videoRef, onLike, onComment, isLiking }) => {
    const stats = post.analytics || {};

    return (
        <div className="flex flex-col bg-white dark:bg-slate-900">
            {/* LI Header */}
            <div className="p-3 pb-0 flex items-start gap-2">
                <Avatar className="h-12 w-12 rounded-sm shrink-0">
                    <AvatarImage src={post.socialAccountId?.thumbnail || post.socialAccountId?.avatar || post.socialAccountId?.picture || post.socialAccountId?.metadata?.picture || post.socialAccountId?.metadata?.thumbnail} />
                    <AvatarFallback className="rounded-sm bg-slate-100">{post.socialAccountId?.displayName?.[0] || 'L'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 hover:underline cursor-pointer">
                            {post.socialAccountId?.displayName}
                        </span>
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-[13px] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors cursor-pointer">
                            <UserPlus className="w-4 h-4" />
                            <span>Follow</span>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">Software Engineer | Content Creator</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>{format(new Date(post.scheduledAt), "MMM d")}</span>
                        <span>•</span>
                        <Badge variant="ghost" className="h-3 p-0 text-[10px]">Edited</Badge>
                    </div>
                </div>
            </div>

            {/* LI Caption */}
            <div className="px-3 py-3">
                <p className="text-sm text-slate-900 dark:text-slate-100 line-clamp-4 leading-relaxed">
                    {post.caption}
                </p>
            </div>

            {/* LI Media */}
            <div className="w-full bg-slate-50 dark:bg-slate-950 relative group/media overflow-hidden border-y border-slate-100 dark:border-slate-800">
                <MediaRenderer 
                    post={post} 
                    isMuted={isMuted} 
                    setIsMuted={setIsMuted}
                    currentMediaIndex={currentMediaIndex}
                    setCurrentMediaIndex={setCurrentMediaIndex}
                    videoRef={videoRef}
                />
            </div>

            {/* LI Stats */}
            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div 
                    className={cn(
                        "flex items-center gap-1 cursor-pointer transition-all",
                        isLiking ? "opacity-50" : "hover:scale-105"
                    )}
                    onClick={onLike}
                >
                    <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white ring-1 ring-white">👍</div>
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[8px] text-white ring-1 ring-white">❤️</div>
                    </div>
                    <span className="text-[11px] text-slate-500 hover:text-blue-600 hover:underline">
                        {stats.likes || 0}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span 
                        className="hover:text-blue-600 hover:underline cursor-pointer"
                        onClick={onComment}
                    >
                        {stats.comments || 0} comments
                    </span>
                    <span>•</span>
                    <span className="hover:text-blue-600 hover:underline cursor-pointer">{stats.shares || 0} reposts</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Facebook Specific Card
 */
export const FacebookPostCard = ({ post, isMuted, setIsMuted, currentMediaIndex, setCurrentMediaIndex, videoRef, onLike, onComment, isLiking }) => {
    const stats = post.analytics || {};

    return (
        <div className="flex flex-col bg-white dark:bg-slate-900 shadow-sm">
            {/* FB Header */}
            <div className="p-3 flex items-center gap-2">
                <Avatar className="h-10 w-10 ring-1 ring-slate-100 dark:ring-slate-800">
                    <AvatarImage src={post.socialAccountId?.thumbnail || post.socialAccountId?.avatar || post.socialAccountId?.picture || post.socialAccountId?.metadata?.picture || post.socialAccountId?.metadata?.thumbnail} />
                    <AvatarFallback>{post.socialAccountId?.displayName?.[0] || 'F'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-slate-900 dark:text-slate-100 leading-none hover:underline cursor-pointer">
                        {post.socialAccountId?.displayName}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <span>{format(new Date(post.scheduledAt), "MMMM d")}</span>
                        <span>•</span>
                        <div className="w-3 h-3 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <Share2 className="w-2 h-2" />
                        </div>
                    </div>
                </div>
                <MoreVertical className="w-5 h-5 text-slate-500 ml-auto cursor-pointer" />
            </div>

            {/* FB Caption */}
            <div className="px-3 pb-3 text-[14px] text-slate-900 dark:text-slate-100 leading-relaxed">
                {post.caption}
            </div>

            {/* FB Media */}
            <div className="w-full bg-slate-50 dark:bg-slate-950 relative group/media overflow-hidden border-y border-slate-100 dark:border-slate-800">
                <MediaRenderer 
                    post={post} 
                    isMuted={isMuted} 
                    setIsMuted={setIsMuted}
                    currentMediaIndex={currentMediaIndex}
                    setCurrentMediaIndex={setCurrentMediaIndex}
                    videoRef={videoRef}
                />
            </div>

            {/* FB Stats */}
            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mx-1">
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center w-4 h-4 bg-blue-600 rounded-full">
                        <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                    <span className="text-[13px] text-slate-500">{stats.likes || 0}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-slate-500">
                    <span className="hover:underline cursor-pointer">{stats.comments || 0} comments</span>
                    <span className="hover:underline cursor-pointer">{stats.shares || 0} shares</span>
                </div>
            </div>

            <div className="px-1 py-1 flex items-center">
                <button 
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 transition-colors font-semibold text-[13px] rounded-md",
                        isLiking ? "text-blue-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    onClick={onLike}
                    disabled={isLiking}
                >
                    <ThumbsUp className={cn("w-4 h-4", isLiking && "animate-bounce")} />
                    <span>Like</span>
                </button>
                <button 
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors font-semibold text-[13px]"
                    onClick={onComment}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comment</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors font-semibold text-[13px]">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                </button>
            </div>
        </div>
    );
};

/**
 * Common Media Renderer for all platforms
 */
export const MediaRenderer = ({ post, isMuted, setIsMuted, currentMediaIndex, setCurrentMediaIndex, videoRef, objectFit = "cover" }) => {
    const mediaList = post.mediaIds && post.mediaIds.length > 0 ? post.mediaIds : (post.media || post.mediaId ? [post.media || post.mediaId] : []);
    
    if (mediaList.length === 0) return (
        <div className="flex flex-col items-center justify-center text-slate-300 h-full">
            <Share2 className="h-12 w-12 opacity-20" />
            <span className="text-xs mt-2 font-medium opacity-40 uppercase tracking-widest">No Media</span>
        </div>
    );

    const activeMedia = mediaList[currentMediaIndex];

    return (
        <div className="w-full h-full relative">
            {/* Carousel Navigation */}
            {mediaList.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentMediaIndex(prev => (prev > 0 ? prev - 1 : mediaList.length - 1));
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 shadow-lg opacity-0 group-hover/media:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentMediaIndex(prev => (prev < mediaList.length - 1 ? prev + 1 : 0));
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 shadow-lg opacity-0 group-hover/media:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    {/* Dots / Page Indicator */}
                    <div className="absolute bottom-3 right-3 z-10 flex gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] text-white font-bold tabular-nums">
                        {currentMediaIndex + 1}/{mediaList.length}
                    </div>
                </>
            )}

            {/* Media Content */}
            <div className="w-full h-full">
                {activeMedia.type === 'video' ? (
                    <div className="relative w-full h-full">
                        <video
                            ref={videoRef}
                            src={activeMedia.url}
                            className={cn("w-full h-full", objectFit === "cover" ? "object-cover" : "object-contain")}
                            autoPlay
                            muted={isMuted}
                            loop
                            playsInline
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                            }}
                            className="absolute bottom-3 left-3 z-20 p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all duration-300 hover:scale-110 active:scale-90"
                        >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/media:opacity-30 transition-opacity">
                            <Play className="w-16 h-16 text-white fill-white" />
                        </div>
                    </div>
                ) : (
                    <img
                        src={activeMedia.url}
                        alt={`Post media ${currentMediaIndex + 1}`}
                        className={cn("w-full h-full transition-transform duration-1000", objectFit === "cover" ? "object-cover group-hover:scale-105" : "object-contain")}
                    />
                )}
            </div>
        </div>
    );
};

/**
 * Helper to get normalized avatar
 */
const getPlatformAvatar = (account) => {
    if (!account) return `https://ui-avatars.com/api/?name=User&background=random`;
    const name = account.platformUserName || account.channelTitle || 'User';
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    return account.avatarUrl || account.avatar || account.picture || account.thumbnail || defaultAvatar;
};

/**
 * Shared Wrapper for 9:16 Content
 */
const BaseImmersiveCard = ({ post, isMuted, setIsMuted, currentMediaIndex, setCurrentMediaIndex, videoRef, children, badge, badgeClass }) => (
    <div className="flex flex-col h-[500px] bg-black relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl group/immersive">
        <div className="absolute inset-0">
            <MediaRenderer 
                post={post} 
                isMuted={isMuted} 
                setIsMuted={setIsMuted}
                currentMediaIndex={currentMediaIndex}
                setCurrentMediaIndex={setCurrentMediaIndex}
                videoRef={videoRef}
                className="h-full w-full object-cover"
            />
        </div>
        {children}
        <div className="absolute top-3 right-3">
            <Badge className={cn("text-white border-none text-[9px] font-bold px-2 py-0.5 backdrop-blur-md shadow-lg", badgeClass)}>
                {badge}
            </Badge>
        </div>
    </div>
);

/**
 * Instagram Story Specific Card
 */
export const InstagramStoryCard = (props) => {
    const profilePic = getPlatformAvatar(props.post.socialAccountId);

    return (
        <BaseImmersiveCard {...props} badge="STORY" badgeClass="bg-fuchsia-600/90">
            <div className="absolute inset-0 flex flex-col p-3 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/20">
                <div className="flex gap-1 mb-3">
                    <div className="h-0.5 flex-1 bg-white" />
                    <div className="h-0.5 flex-1 bg-white/30" />
                </div>

                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-white/20">
                        <AvatarImage src={profilePic} />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white shadow-sm">{props.post.socialAccountId?.platformUserName || 'Instagram'}</span>
                        <span className="text-[9px] text-white/80 shadow-sm">
                            {props.post.scheduledAt ? format(new Date(props.post.scheduledAt), 'h:mm a') : 'Scheduled'}
                        </span>
                    </div>
                </div>

                <div className="mt-auto flex items-center gap-3">
                    <div className="flex-1 h-8 rounded-full border border-white/40 bg-black/20 backdrop-blur-sm px-4 flex items-center">
                        <span className="text-[10px] text-white/70 font-medium">Send message</span>
                    </div>
                    <Heart className="h-5 w-5 text-white" />
                    <Share2 className="h-5 w-5 text-white -rotate-12" />
                </div>
            </div>
        </BaseImmersiveCard>
    );
};

/**
 * Instagram Reel Specific Card
 */
export const InstagramReelCard = (props) => {
    const { post, onLike, onComment, isLiking } = props;
    const stats = post.analytics || {};
    const profilePic = getPlatformAvatar(post.socialAccountId);

    return (
        <BaseImmersiveCard {...props} badge="REEL" badgeClass="bg-gradient-to-r from-purple-600 to-fuchsia-600">
            <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none">
                <div className="flex items-end justify-between gap-4 pointer-events-auto">
                    {/* Left: Info */}
                    <div className="flex flex-col gap-2 pb-2">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-white/20">
                                <AvatarImage src={profilePic} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-white">{post.socialAccountId?.platformUserName || 'Instagram'}</span>
                        </div>
                        <div className="text-[11px] text-white line-clamp-2 pr-4 leading-relaxed font-medium drop-shadow-md">
                            {post.caption || "No caption..."}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-center gap-4 pb-2">
                        <div className="flex flex-col items-center gap-1 group/action cursor-pointer">
                            <div className={cn(
                                "p-2 rounded-full transition-all",
                                isLiking ? "text-red-400 scale-125" : "text-white hover:bg-white/10"
                            )}>
                                <Heart className={cn("h-6 w-6", isLiking && "fill-current")} onClick={onLike} />
                            </div>
                            <span className="text-[10px] text-white font-bold">{stats.likes || 0}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 group/action cursor-pointer">
                            <div className="p-2 rounded-full text-white hover:bg-white/10 transition-all">
                                <MessageCircle className="h-6 w-6" onClick={onComment} />
                            </div>
                            <span className="text-[10px] text-white font-bold">{stats.comments || 0}</span>
                        </div>
                        <div className="p-2 rounded-full text-white hover:bg-white/10 transition-all cursor-pointer">
                            <Share2 className="h-6 w-6 -rotate-12" />
                        </div>
                    </div>
                </div>
            </div>
        </BaseImmersiveCard>
    );
};

/**
 * YouTube Short Specific Card
 */
export const YouTubeShortCard = (props) => {
    const { post } = props;
    const stats = post.analytics || {};
    
    return (
        <BaseImmersiveCard {...props} badge="SHORT" badgeClass="bg-red-600" badgeChild={<Play className="h-2.5 w-2.5 fill-current mr-1" />}>
            <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none">
                <div className="flex items-end justify-between gap-4 pointer-events-auto">
                    <div className="flex flex-col gap-2 pb-4">
                        <div className="text-sm font-bold text-white drop-shadow-lg">{post.socialAccountId?.channelTitle || 'YouTube'}</div>
                        <div className="text-[11px] text-white line-clamp-2 leading-relaxed drop-shadow-md">
                            {post.caption || "No title..."}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-5 pb-4">
                        <div className="flex flex-col items-center gap-1 group/action cursor-pointer">
                            <div className="p-2 rounded-full bg-slate-800/40 text-white hover:bg-slate-800/60 backdrop-blur-md transition-all">
                                <ThumbsUp className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] text-white font-bold">{stats.likes || 0}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 group/action cursor-pointer">
                            <div className="p-2 rounded-full bg-slate-800/40 text-white hover:bg-slate-800/60 backdrop-blur-md transition-all">
                                <MessageCircle className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] text-white font-bold">{stats.comments || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </BaseImmersiveCard>
    );
};
