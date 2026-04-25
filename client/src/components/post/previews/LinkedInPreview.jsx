import React from "react";
import { format } from "date-fns";
import { ThumbsUp, MessageSquare, Repeat2, Send, MoreHorizontal, ChevronLeft, ChevronRight, Globe, ImageIcon, UserPlus, Heart } from "lucide-react";

const LinkedInPreview = ({ 
    caption, 
    media = [], 
    currentIndex = 0, 
    onIndexChange, 
    displayName, 
    avatarName, 
    avatarUrl,
    scheduledAt 
}) => {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName || 'Company')}&background=random`;
    const profilePic = avatarUrl || defaultAvatar;
    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 shadow-sm animate-in fade-in duration-500 overflow-y-auto scrollbar-hide">
            {/* Post Header */}
            <div className="p-3 pb-2 flex gap-2">
                <div className="h-12 w-12 rounded-sm bg-gray-100 overflow-hidden shrink-0">
                    <img
                        src={profilePic}
                        className="h-full w-full object-cover"
                        alt="User"
                    />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-bold truncate">{displayName || 'Company Name'}</span>
                        <span className="text-gray-400 text-xs">•</span>
                        <button className="text-[#0a66c2] text-sm font-bold hover:underline flex items-center gap-1">
                            <UserPlus className="h-3 w-3" />
                            <span>Follow</span>
                        </button>
                    </div>
                    <span className="text-[11px] text-gray-500 truncate">Professional Services • Digital Assets</span>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                        <span>Just now</span>
                        <span>•</span>
                        <Globe className="h-2.5 w-2.5" />
                    </div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-500 shrink-0" />
            </div>

            {/* Caption */}
            <div className="px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {caption || <span className="text-gray-400 italic">What do you want to talk about?</span>}
            </div>

            {/* Media */}
            <div className="bg-gray-50 dark:bg-gray-800/50 relative group/preview">
                {media.length > 0 ? (
                    <div className="aspect-[1.91/1] w-full flex items-center justify-center overflow-hidden border-y border-gray-100 dark:border-gray-800">
                        {media[currentIndex].type === 'video' ? (
                            <video key={media[currentIndex]._id} src={media[currentIndex].url} className="w-full h-full object-cover" controls={false} autoPlay muted loop />
                        ) : (
                            <img key={media[currentIndex]._id} src={media[currentIndex].url} alt="LinkedIn preview" className="w-full h-full object-cover" />
                        )}

                        {media.length > 1 && (
                            <>
                                <button 
                                    type="button"
                                    onClick={() => onIndexChange(currentIndex === 0 ? media.length - 1 : currentIndex - 1)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/50 p-1 rounded-full shadow-md z-10"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => onIndexChange(currentIndex === media.length - 1 ? 0 : currentIndex + 1)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/50 p-1 rounded-full shadow-md z-10"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                                <div className="absolute top-2 right-2 bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] font-bold">
                                    {currentIndex + 1}/{media.length}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center border-y border-gray-100 dark:border-gray-800">
                        <ImageIcon className="h-10 w-10 text-gray-200" />
                    </div>
                )}
            </div>

            {/* Interaction Bar */}
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-1">
                <div className="flex -space-x-1">
                    <div className="h-4 w-4 rounded-full bg-blue-500 border border-white dark:border-gray-900 flex items-center justify-center"><ThumbsUp className="h-2 w-2 text-white" /></div>
                    <div className="h-4 w-4 rounded-full bg-red-500 border border-white dark:border-gray-900 flex items-center justify-center"><Heart className="h-2 w-2 text-white" /></div>
                </div>
                <span className="text-[11px] text-gray-500 ml-1">45 • 8 comments</span>
            </div>

            {/* Action Buttons */}
            <div className="flex px-1 py-1">
                <button className="flex-1 flex flex-col items-center justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-semibold gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-[10px]">Like</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-semibold gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-[10px]">Comment</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-semibold gap-1">
                    <Repeat2 className="h-4 w-4" />
                    <span className="text-[10px]">Repost</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-semibold gap-1">
                    <Send className="h-4 w-4" />
                    <span className="text-[10px]">Send</span>
                </button>
            </div>
        </div>
    );
};

export default LinkedInPreview;
