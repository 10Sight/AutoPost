import React from "react";
import { format } from "date-fns";
import { ThumbsUp, ThumbsDown, Share2, Youtube, MoreVertical, MoreHorizontal, Bell, MessageCircle } from "lucide-react";

const YouTubePreview = ({ 
    caption, 
    media = [], 
    currentIndex = 0, 
    onIndexChange, 
    displayName, 
    avatarName, 
    avatarUrl,
    scheduledAt,
    postType = "post"
}) => {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName || 'Channel')}&background=random`;
    const profilePic = avatarUrl || defaultAvatar;
    const isShort = postType === "short";
    
    // YouTube title is usually the first line of the caption
    const captionLines = caption?.split('\n') || [];
    const title = captionLines[0] || 'My Amazing Video';
    const description = captionLines.slice(1).join('\n') || caption || '';

    if (isShort) {
        return (
            <div className="flex flex-col h-full bg-black animate-in fade-in duration-500 relative overflow-hidden">
                {/* Shorts Player */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {media.length > 0 ? (
                        media[currentIndex].type === 'video' ? (
                            <video key={media[currentIndex]._id} src={media[currentIndex].url} className="w-full h-full object-cover" autoPlay muted loop />
                        ) : (
                            <img key={media[currentIndex]._id} src={media[currentIndex].url} alt="Shorts preview" className="w-full h-full object-cover" />
                        )
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                             <Youtube className="h-12 w-12 text-gray-800" />
                             <span className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">Shorts</span>
                        </div>
                    )}
                </div>

                {/* Shorts UI Overlay */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none">
                    <div className="flex justify-between items-end gap-4 pb-4">
                        {/* Left: Info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full overflow-hidden border border-white/20">
                                    <img
                                        src={profilePic}
                                        className="h-full w-full object-cover"
                                        alt="User"
                                    />
                                </div>
                                <span className="text-sm font-bold text-white shadow-sm">{displayName || 'Channel Name'}</span>
                                <button className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-3 py-1 rounded-full text-white ml-2">
                                    Subscribe
                                </button>
                            </div>
                            <div className="text-sm text-white font-medium line-clamp-2 pr-10 shadow-sm">
                                {title}
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col gap-5 items-center">
                            <div className="flex flex-col items-center gap-1">
                                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-full">
                                    <ThumbsUp className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-[10px] text-white font-bold">12K</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-full">
                                    <ThumbsDown className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-[10px] text-white font-bold">Dislike</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-full">
                                    <MessageCircle className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-[10px] text-white font-bold">456</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-full">
                                    <Share2 className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-[10px] text-white font-bold">Share</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#0f0f0f] animate-in fade-in duration-500 overflow-y-auto scrollbar-hide">
             {/* YT Header */}
             <div className="h-12 flex items-center justify-between px-3 bg-white dark:bg-[#0f0f0f] shrink-0 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1 text-red-600 font-bold">
                    <Youtube className="h-6 w-6" />
                    <span className="text-black dark:text-white tracking-tighter">YouTube</span>
                </div>
                <div className="flex gap-4">
                    <div className="h-6 w-6 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-6 w-6 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
            </div>

            {/* Video Player Area */}
            <div className="aspect-video w-full bg-black flex items-center justify-center relative group/preview">
                {media.length > 0 ? (
                    media[currentIndex].type === 'video' ? (
                        <video key={media[currentIndex]._id} src={media[currentIndex].url} className="w-full h-full object-contain" controls autoPlay muted />
                    ) : (
                        <img key={media[currentIndex]._id} src={media[currentIndex].url} alt="YT preview" className="w-full h-full object-contain" />
                    )
                ) : (
                    <div className="flex items-center justify-center">
                         <Youtube className="h-12 w-12 text-gray-800" />
                    </div>
                )}
            </div>

            {/* Content Info */}
            <div className="p-3 space-y-3">
                <div className="flex justify-between items-start gap-4">
                    <h1 className="text-[17px] font-bold leading-tight line-clamp-2 flex-1 dark:text-white">
                        {title}
                    </h1>
                    <MoreVertical className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span>123K views</span>
                    <span className="mx-1">•</span>
                    <span>Just now</span>
                </div>

                {/* Channel Info */}
                <div className="flex items-center gap-3 py-1">
                    <div className="h-9 w-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        <img
                            src={profilePic}
                            className="h-full w-full object-cover"
                            alt="User"
                        />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-bold truncate dark:text-white">{displayName || 'Channel Name'}</span>
                        <span className="text-[11px] text-gray-400">1.2M subscribers</span>
                    </div>
                    <button className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2 rounded-full hover:opacity-90">
                        Subscribe
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full h-9 items-center shrink-0">
                        <div className="px-3 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors cursor-pointer rounded-l-full">
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-xs font-bold">12K</span>
                        </div>
                        <div className="px-3 hover:bg-gray-200 transition-colors cursor-pointer rounded-r-full h-full flex items-center">
                            <ThumbsDown className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full h-9 items-center px-3 gap-2 shrink-0 hover:bg-gray-200 transition-colors cursor-pointer">
                        <Share2 className="h-4 w-4" />
                        <span className="text-xs font-bold">Share</span>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full h-9 items-center px-3 gap-2 shrink-0">
                        <div className="h-4 w-4 rounded bg-gray-300" />
                        <span className="text-xs font-bold">Download</span>
                    </div>
                </div>

                {/* Description Mockup */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-xs leading-relaxed dark:text-gray-300">
                    <span className="font-bold">1.2M views  Just now</span>
                    <div className="mt-1 line-clamp-3">
                        {description}
                    </div>
                    <span className="font-bold mt-2 block ">...more</span>
                </div>
            </div>
        </div>
    );
};

export default YouTubePreview;
