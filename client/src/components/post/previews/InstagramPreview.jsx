import React from "react";
import { format } from "date-fns";
import { Heart, MessageCircle, Send, Bookmark, Camera, Tv, Home, Search as SearchIcon, PlusSquare, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

const InstagramPreview = ({ 
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
    const isImmersive = postType === "story" || postType === "reel";

    if (isImmersive) {
        return (
            <div className="flex flex-col h-full animate-in fade-in duration-500 bg-black relative overflow-hidden group/preview">
                {/* Media Preview (Full Screen) */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {media.length > 0 ? (
                        <>
                            {media[currentIndex].type === 'video' ? (
                                <video key={media[currentIndex]._id} src={media[currentIndex].url} className="h-full w-full object-cover" controls={false} autoPlay muted loop />
                            ) : (
                                <img key={media[currentIndex]._id} src={media[currentIndex].url} alt="Story preview" className="h-full w-full object-cover" />
                            )}
                        </>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-900">
                             <div className="flex flex-col items-center gap-2">
                                <Camera className="h-12 w-12 text-gray-700" />
                                <span className="text-gray-600 text-[10px] uppercase font-bold tracking-widest">{postType}</span>
                             </div>
                        </div>
                    )}
                </div>

                {/* Story/Reel Overlay Content */}
                <div className="absolute inset-0 flex flex-col pointer-events-none p-4 pb-6 bg-gradient-to-b from-black/40 via-transparent to-black/60">
                    {/* Top Bars (Story Style) */}
                    {postType === 'story' && (
                        <div className="flex gap-1 mb-4">
                            <div className="h-0.5 flex-1 bg-white" />
                            <div className="h-0.5 flex-1 bg-white/30" />
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full border-2 border-fuchsia-600 p-[1px]">
                             <img
                                src={profilePic}
                                className="h-full w-full rounded-full object-cover"
                                alt="User"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white shadow-sm">{displayName || 'Your Page Name'}</span>
                            <span className="text-[10px] text-white/80 shadow-sm">{scheduledAt ? format(new Date(scheduledAt), 'h:mm a') : 'Just now'}</span>
                        </div>
                    </div>

                    {/* Bottom Actions/Caption */}
                    <div className="mt-auto flex flex-col gap-3">
                        {postType === 'reel' && (
                            <div className="flex flex-col gap-2">
                                <div className="text-xs text-white font-bold">{displayName?.replace('@', '')}</div>
                                <div className="text-xs text-white line-clamp-2 pr-12">{caption || "No caption..."}</div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                            {postType === 'story' ? (
                                <>
                                    <div className="flex-1 h-9 rounded-full border border-white/40 bg-black/20 backdrop-blur-sm px-4 flex items-center">
                                        <span className="text-xs text-white/70">Send message</span>
                                    </div>
                                    <Heart className="h-6 w-6 text-white" />
                                    <Send className="h-6 w-6 text-white -rotate-12" />
                                </>
                            ) : (
                                <div className="flex-1 flex justify-end gap-5 py-2">
                                    <div className="flex flex-col items-center gap-1">
                                        <Heart className="h-7 w-7 text-white" />
                                        <span className="text-[10px] text-white">Likes</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <MessageCircle className="h-7 w-7 text-white" />
                                        <span className="text-[10px] text-white">12</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Send className="h-7 w-7 text-white -rotate-12" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* App Header */}
            <div className="h-10 border-b flex items-center justify-between px-3 bg-white dark:bg-gray-950 shrink-0">
                <Camera className="h-5 w-5" />
                <span className="font-serif italic text-lg font-bold tracking-tight">Instagram</span>
                <div className="flex gap-3">
                    <Tv className="h-5 w-5" />
                    <Send className="h-5 w-5 -rotate-12" />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide bg-white dark:bg-gray-950">
                {/* Header */}
                <div className="flex items-center gap-2 p-2.5 text-gray-900 dark:text-gray-100">
                    <div className="h-8 w-8 rounded-full p-[1px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600 overflow-hidden">
                        <div className="h-full w-full rounded-full bg-white dark:bg-gray-950 p-[1px]">
                            <img
                                src={profilePic}
                                className="h-full w-full rounded-full object-cover"
                                alt="User"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold leading-none mb-0.5">{displayName || 'Your Page Name'}</span>
                        <span className="text-[10px] text-gray-500 leading-none">New York, NY</span>
                    </div>
                    <div className="ml-auto">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </div>
                </div>

                {/* Media Preview */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative group/preview">
                    {media.length > 0 ? (
                        <>
                            {media[currentIndex].type === 'video' ? (
                                <video key={media[currentIndex]._id} src={media[currentIndex].url} className="h-full w-full object-cover" controls={false} autoPlay muted loop />
                            ) : (
                                <img key={media[currentIndex]._id} src={media[currentIndex].url} alt="Post preview" className="h-full w-full object-cover animate-in fade-in duration-300" />
                            )}

                            {media.length > 1 && (
                                <>
                                    <button 
                                        type="button"
                                        onClick={() => onIndexChange(currentIndex === 0 ? media.length - 1 : currentIndex - 1)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover/preview:opacity-100 transition-opacity"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => onIndexChange(currentIndex === media.length - 1 ? 0 : currentIndex + 1)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover/preview:opacity-100 transition-opacity"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <div className="absolute top-2 right-2 bg-black/70 text-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur-sm z-10">
                                        {currentIndex + 1}/{media.length}
                                    </div>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                        {media.map((_, i) => (
                                            <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-white w-3' : 'bg-white/50'}`} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                             <Home className="h-12 w-12 text-gray-200" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between p-3 pb-2">
                    <div className="flex items-center gap-4">
                        <Heart className="h-5 w-5" />
                        <MessageCircle className="h-5 w-5" />
                        <Send className="h-5 w-5 -rotate-12" />
                    </div>
                    <Bookmark className="h-5 w-5" />
                </div>

                {/* Caption Area */}
                <div className="px-3 pb-4 space-y-1">
                    <div className="text-xs font-bold">1,234 likes</div>
                    <div className="text-xs leading-relaxed">
                        <span className="font-bold mr-1">{displayName?.replace('@', '')}</span>
                        {caption ? (
                            <span className="whitespace-pre-wrap">{caption}</span>
                        ) : (
                            <span className="text-gray-400 italic">Write a caption...</span>
                        )}
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-tighter pt-1 font-medium">
                        {scheduledAt ? format(new Date(scheduledAt), 'MMMM d, yyyy') : 'Just now'}
                    </div>
                </div>
            </div>

            {/* Bottom Nav */}
            <div className="h-11 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around shrink-0 bg-white dark:bg-gray-950">
                <Home className="h-5 w-5" />
                <SearchIcon className="h-5 w-5" />
                <PlusSquare className="h-5 w-5" />
                <Heart className="h-5 w-5" />
                <div className="h-5 w-5 rounded-full border border-current p-[1.5px]">
                    <div className="h-full w-full rounded-full bg-gray-200" />
                </div>
            </div>
        </div>
    );
};

export default InstagramPreview;
