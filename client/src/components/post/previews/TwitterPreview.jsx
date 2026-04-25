import React from "react";
import { format } from "date-fns";
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";

const TwitterPreview = ({ 
    caption, 
    media = [], 
    currentIndex = 0, 
    onIndexChange, 
    displayName, 
    avatarName, 
    avatarUrl,
    scheduledAt 
}) => {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName || 'User')}&background=random`;
    const profilePic = avatarUrl || defaultAvatar;
    return (
        <div className="flex flex-col h-full bg-white dark:bg-black animate-in fade-in duration-500 overflow-y-auto scrollbar-hide">
            {/* Header */}
            <div className="p-4 flex gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden shrink-0">
                    <img
                        src={profilePic}
                        className="h-full w-full object-cover"
                        alt="User"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[15px] font-bold leading-tight truncate">{displayName || 'User Name'}</span>
                            <span className="text-[14px] text-gray-500 leading-tight truncate">@{displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'your_handle'}</span>
                        </div>
                        <MoreHorizontal className="h-5 w-5 text-gray-500" />
                    </div>

                    {/* Tweet Content */}
                    <div className="mt-3 text-[15px] leading-normal whitespace-pre-wrap break-words">
                        {caption || <span className="text-gray-400 italic">What's happening?</span>}
                    </div>

                    {/* Media Container */}
                    {media.length > 0 && (
                        <div className="mt-3 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative group/preview">
                            <div className="aspect-[16/9] w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                {media[currentIndex].type === 'video' ? (
                                    <video key={media[currentIndex]._id} src={media[currentIndex].url} className="w-full h-full object-cover" controls={false} autoPlay muted loop />
                                ) : (
                                    <img key={media[currentIndex]._id} src={media[currentIndex].url} alt="X preview" className="w-full h-full object-cover" />
                                )}

                                {media.length > 1 && (
                                    <>
                                        <button 
                                            type="button"
                                            onClick={() => onIndexChange(currentIndex === 0 ? media.length - 1 : currentIndex - 1)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => onIndexChange(currentIndex === media.length - 1 ? 0 : currentIndex + 1)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                            {media.map((_, i) => (
                                                <div key={i} className={`h-1 w-1 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-4 flex items-center justify-between text-gray-500 max-w-[400px]">
                        <div className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer transition-colors">
                            <MessageCircle className="h-[18px] w-[18px]" />
                            <span className="text-xs">12</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-green-400 cursor-pointer transition-colors">
                            <Repeat2 className="h-[18px] w-[18px]" />
                            <span className="text-xs">4</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-pink-400 cursor-pointer transition-colors">
                            <Heart className="h-[18px] w-[18px]" />
                            <span className="text-xs">85</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer transition-colors">
                            <BarChart2 className="h-[18px] w-[18px]" />
                            <span className="text-xs">1.2K</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-blue-400 cursor-pointer transition-colors">
                            <Share className="h-[18px] w-[18px]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TwitterPreview;
