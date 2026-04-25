import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import {
    useGetPostEngagementQuery,
    useGetPostCommentsQuery,
    useAddPostCommentMutation,
} from "../../redux/slices/engagementApiSlice";
import {
    Heart,
    MessageCircle,
    Eye,
    Share2,
    Send,
    Loader2,
    MessageSquare,
    CornerDownRight,
    User,
    Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

const PostEngagementModal = ({ post, isOpen, onOpenChange }) => {
    const [commentText, setCommentText] = useState("");
    const [replyTo, setReplyTo] = useState(null);

    const { 
        data: statsData, 
        isLoading: statsLoading, 
        refetch: refetchStats 
    } = useGetPostEngagementQuery(post?._id, { skip: !isOpen });

    const { 
        data: commentsData, 
        isLoading: commentsLoading 
    } = useGetPostCommentsQuery(post?._id, { skip: !isOpen });

    const [addComment, { isLoading: isPosting }] = useAddPostCommentMutation();

    const stats = statsData?.data;
    const comments = commentsData?.data || [];

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            await addComment({
                postId: post._id,
                text: commentText,
                parentId: replyTo?.id
            }).unwrap();
            
            toast.success(replyTo ? "Reply posted" : "Comment posted");
            setCommentText("");
            setReplyTo(null);
        } catch (err) {
            toast.error(err?.data?.message || "Failed to post comment");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Post Engagement</DialogTitle>
                                <DialogDescription className="text-sm">
                                    Real-time interaction and metrics for your {post?.platform} post.
                                </DialogDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-white dark:bg-slate-900 h-6 px-2 text-[10px] font-bold tracking-widest uppercase border-slate-200 dark:border-slate-800">
                            ID: {post?.platformPostId}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side: Stats & Preview */}
                    <div className="w-1/3 border-r border-slate-100 dark:border-slate-900 p-6 space-y-8 bg-slate-50/20 dark:bg-slate-900/20">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Live Metrics</h3>
                            
                            {statsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    <MetricCard icon={<Eye className="w-4 h-4" />} label="Total Views" value={stats?.views} color="blue" />
                                    <MetricCard icon={<Heart className="w-4 h-4" />} label="Total Likes" value={stats?.likes} color="rose" />
                                    <MetricCard icon={<MessageCircle className="w-4 h-4" />} label="Comments" value={stats?.comments} color="emerald" />
                                </div>
                            )}
                        </div>

                        <Separator className="bg-slate-100 dark:bg-slate-800" />

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Post Summary</h3>
                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 leading-relaxed italic">
                                    "{post?.caption}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Comments Feed */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
                        <div className="p-4 px-6 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-primary" />
                                Community Interaction
                            </h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-xs font-bold text-primary hover:bg-primary/5"
                                onClick={refetchStats}
                                disabled={statsLoading}
                            >
                                {statsLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                Refresh
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            {commentsLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Retrieving comments...</p>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 py-20">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                        <MessageSquare className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-sm font-medium">No comments yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {comments.map(comment => (
                                        <CommentItem 
                                            key={comment.id} 
                                            comment={comment} 
                                            onReply={() => {
                                                setReplyTo(comment);
                                                setCommentText(`@${comment.author} `);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Reply Input Area */}
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900">
                            {replyTo && (
                                <div className="mb-3 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                        <CornerDownRight className="w-3 h-3" />
                                        Replying to {replyTo.author}
                                    </p>
                                    <button onClick={() => { setReplyTo(null); setCommentText(""); }} className="text-primary hover:text-primary/70">
                                        <Clock className="w-3.5 h-3.5 rotate-45" />
                                    </button>
                                </div>
                            )}
                            <form onSubmit={handlePostComment} className="relative">
                                <Avatar className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 border-2 border-white dark:border-slate-900 shadow-sm">
                                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                </Avatar>
                                <Input 
                                    placeholder={replyTo ? `Write a reply...` : "Write a comment..."}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="h-12 pl-13 pr-14 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-primary/20 shadow-sm"
                                />
                                <Button 
                                    type="submit"
                                    disabled={!commentText.trim() || isPosting}
                                    size="icon"
                                    className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95"
                                >
                                    {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </form>
                            <p className="mt-3 text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                                Posting as your connected account
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const MetricCard = ({ icon, label, value, color }) => (
    <div className={cn(
        "p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02]",
        color === "blue" ? "bg-blue-50/50 border-blue-100 text-blue-600 dark:bg-blue-900/10 dark:border-blue-900/30 dark:text-blue-400" :
        color === "rose" ? "bg-rose-50/50 border-rose-100 text-rose-600 dark:bg-rose-900/10 dark:border-rose-900/30 dark:text-rose-400" :
        "bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-400"
    )}>
        <div className="flex items-center gap-3 mb-1">
            <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-sm">
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-70">{label}</span>
        </div>
        <div className="text-2xl font-black tabular-nums">{value?.toLocaleString() || 0}</div>
    </div>
);

const CommentItem = ({ comment, onReply }) => (
    <div className="space-y-4 group">
        <div className="flex gap-4">
            <Avatar className="w-10 h-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                <AvatarImage src={comment.authorAvatar} />
                <AvatarFallback>{comment.author[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{comment.author}</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                        {formatDistanceToNow(new Date(comment.publishedAt))} ago
                    </span>
                </div>
                <div 
                    className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: comment.text }}
                />
                <div className="flex items-center gap-6 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Heart className="w-3.5 h-3.5" />
                        {comment.likeCount || 0}
                    </div>
                    <button 
                        onClick={onReply}
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                    >
                        Reply
                    </button>
                </div>
            </div>
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
            <div className="ml-14 space-y-4 pt-2 border-l-2 border-slate-50 dark:border-slate-900 pl-6">
                {comment.replies.map(reply => (
                    <div key={reply.id} className="flex gap-3">
                        <Avatar className="w-7 h-7 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <AvatarImage src={reply.authorAvatar} />
                            <AvatarFallback>{reply.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{reply.author}</span>
                                <span className="text-[9px] font-medium text-slate-400">
                                    {formatDistanceToNow(new Date(reply.publishedAt))} ago
                                </span>
                            </div>
                            <div 
                                className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: reply.text }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default PostEngagementModal;
