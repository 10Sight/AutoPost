import React from "react";
import { format } from "date-fns";
import { ThumbsUp, MessageSquare, Share2, Globe, MoreHorizontal, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

const FacebookPreview = ({ 
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
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName || 'User')}&background=random`;
    const profilePic = avatarUrl || defaultAvatar;
    const isStory = postType === "story";

    if (isStory) {
        return (
            <div className="flex flex-col h-full bg-black animate-in fade-in duration-500 relative overflow-hidden group/preview">
                {/* Media Background */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {media.length > 0 ? (
                        media[currentIndex].type === 'video' ? (
                            <video key={media[currentIndex]._id} src={media[currentIndex].url} className="w-full h-full object-cover" autoPlay muted loop />
                        ) : (
                            <img key={media[currentIndex]._id} src={media[currentIndex].url} alt="FB Story preview" className="w-full h-full object-cover" />
                        )
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                             <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-700" />
                             </div>
                             <span className="text-gray-600 text-[10px] font-bold tracking-widest uppercase">Facebook Story</span>
                        </div>
                    )}
                </div>

                {/* Overlay UI */}
                <div className="absolute inset-0 p-4 flex flex-col pointer-events-none bg-gradient-to-b from-black/50 via-transparent to-black/70">
                    {/* Top Bars */}
                    <div className="flex gap-1 mb-4">
                        <div className="h-0.5 flex-1 bg-white" />
                        <div className="h-0.5 flex-1 bg-white/30" />
                        <div className="h-0.5 flex-1 bg-white/30" />
                    </div>

                    {/* Profile */}
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full border-2 border-[#1877F2] p-[1px]">
                             <img
                                src={profilePic}
                                className="h-full w-full rounded-full object-cover"
                                alt="User"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white shadow-sm">{displayName || 'Your Page Name'}</span>
                            <span className="text-[10px] text-white/80 shadow-sm">Just now</span>
                        </div>
                    </div>

                    {/* Bottom: Send Message */}
                    <div className="mt-auto flex items-center gap-3 py-2">
                        <div className="flex-1 h-10 rounded-full border border-white/30 bg-black/40 backdrop-blur-md px-4 flex items-center">
                            <span className="text-xs text-white/80">Send message</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center">
                            <ThumbsUp className="h-5 w-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-gray-950 animate-in fade-in duration-500">
            {/* FB Header */}
            <div className="h-12 bg-[#1877F2] flex items-center px-4 shrink-0 shadow-sm">
                <div className="mr-2">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                </div>
                <span className="text-white font-bold text-lg tracking-tight">facebook</span>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="bg-white dark:bg-gray-900 shadow-sm mb-3">
                    {/* Post Header */}
                    <div className="flex items-center gap-2 p-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                            <img
                                src={profilePic}
                                className="h-full w-full object-cover"
                                alt="User"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold leading-tight">{displayName || 'Your Page Name'}</span>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                <span>Just now</span>
                                <span>•</span>
                                <Globe className="h-2.5 w-2.5" />
                            </div>
                        </div>
                        <div className="ml-auto">
                            <MoreHorizontal className="h-5 w-5 text-gray-500" />
                        </div>
                    </div>

                    {/* Caption */}
                    <div className="px-3 pb-3 text-sm leading-normal whitespace-pre-wrap">
                        {caption || <span className="text-gray-400 italic">Write something...</span>}
                    </div>

                    {/* Media */}
                    <div className="bg-gray-100 dark:bg-gray-800 relative group/preview">
                        {media.length > 0 ? (
                            <div className="aspect-[1.91/1] w-full flex items-center justify-center overflow-hidden">
                                {media[currentIndex].type === 'video' ? (
                                    <video key={media[currentIndex]._id} src={media[currentIndex].url} className="w-full h-full object-cover" controls={false} autoPlay muted loop />
                                ) : (
                                    <img key={media[currentIndex]._id} src={media[currentIndex].url} alt="FB preview" className="w-full h-full object-cover" />
                                )}
                                
                                {media.length > 1 && (
                                    <>
                                        <button 
                                            type="button"
                                            onClick={() => onIndexChange(currentIndex === 0 ? media.length - 1 : currentIndex - 1)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-1.5 rounded-full shadow-md z-10"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => onIndexChange(currentIndex === media.length - 1 ? 0 : currentIndex + 1)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-1.5 rounded-full shadow-md z-10"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                        <div className="absolute top-3 right-3 bg-black/60 text-white rounded px-2 py-1 text-[10px] font-bold">
                                            {currentIndex + 1} of {media.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center border-y border-gray-100 dark:border-gray-800">
                                <ImageIcon className="h-10 w-10 text-gray-200" />
                            </div>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between text-xs text-gray-500">
                        <span>12 Likes</span>
                        <span>4 Comments • 2 Shares</span>
                    </div>

                    <div className="flex px-1 py-1">
                        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-semibold text-sm">
                            <ThumbsUp className="h-4 w-4" />
                            <span>Like</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-semibold text-sm">
                            <MessageSquare className="h-4 w-4" />
                            <span>Comment</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-semibold text-sm">
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacebookPreview;
