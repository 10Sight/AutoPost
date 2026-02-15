import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "../ui/dialog";
import { format } from "date-fns";
import {
    Calendar,
    Clock,
    Target,
    User,
    Info
} from "lucide-react";
import { Badge } from "../ui/badge";
import VersionHistory from "./VersionHistory";

const PostDetailsModal = ({ post, isOpen, onOpenChange, onRollbackSuccess }) => {
    if (!post) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        Post Details
                        <Badge variant="outline" className="capitalize">
                            {post.platform}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    {/* Left: Preview & Info */}
                    <div className="space-y-6">
                        <div className="aspect-square bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                            {(post.media || post.mediaId) ? (
                                (post.media || post.mediaId).type === 'video' ? (
                                    <video src={(post.media || post.mediaId).url} controls className="w-full h-full object-contain" />
                                ) : (
                                    <img src={(post.media || post.mediaId).url} alt="Post content" className="w-full h-full object-contain" />
                                )
                            ) : (
                                <div className="text-gray-300 flex flex-col items-center gap-2">
                                    <Info className="h-12 w-12" />
                                    <span>No media</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 space-y-4 shadow-sm">
                            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Information</h4>

                            <div className="grid grid-cols-2 gap-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase">Date</span>
                                        <span className="text-xs font-medium">{format(new Date(post.scheduledAt), "MMM d, yyyy")}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase">Time</span>
                                        <span className="text-xs font-medium">{format(new Date(post.scheduledAt), "HH:mm")}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600">
                                        <Target className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase">Status</span>
                                        <span className="text-xs font-medium capitalize">{post.status}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase">Account</span>
                                        <span className="text-xs font-medium truncate max-w-[100px]">{post.socialAccount?.platformUserName || 'Default'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-[10px] text-gray-500 uppercase block mb-2">Current Caption</span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                    {post.caption || <span className="italic opacity-50 text-xs">No caption provided</span>}
                                </p>
                            </div>

                            {post.platform === 'youtube' && (
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                    <h5 className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-red-600" />
                                        YouTube Settings
                                    </h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 dark:bg-gray-950 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                            <span className="text-[9px] text-gray-500 uppercase block">Privacy</span>
                                            <span className="text-xs font-semibold">{post.youtubePrivacyStatus || 'Public'}</span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-950 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                            <span className="text-[9px] text-gray-500 uppercase block">Category ID</span>
                                            <span className="text-xs font-semibold">{post.youtubeCategoryId || '22'}</span>
                                        </div>
                                    </div>
                                    {post.youtubeTags && post.youtubeTags.length > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-gray-500 uppercase block">Tags</span>
                                            <div className="flex flex-wrap gap-1">
                                                {post.youtubeTags.map((tag, i) => (
                                                    <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Version History */}
                    <div className="bg-gray-50/50 dark:bg-gray-950/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                        <VersionHistory
                            postId={post._id}
                            onRollbackSuccess={onRollbackSuccess}
                        />

                        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <h5 className="text-xs font-bold text-primary uppercase mb-2">Pro Tip</h5>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                Rolling back will restore the caption, media, and original scheduled time of the selected version.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PostDetailsModal;
