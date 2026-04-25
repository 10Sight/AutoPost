import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetPostByIdQuery } from "../features/posts/postsApi";
import {
    useGetPostEngagementQuery,
    useGetPostCommentsQuery,
    useAddPostCommentMutation,
    useLikePostCommentMutation,
} from "../redux/slices/engagementApiSlice";
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
    ArrowLeft,
    ExternalLink,
    BarChart3,
    Activity,
    Info,
    Calendar,
    Globe,
    ThumbsUp,
    MoreVertical,
    Reply,
    Smile,
    Image as ImageIcon,
    Search,
    Filter,
    X,
    ChevronDown,
    SortAsc,
    SortDesc,
    Play,
    TrendingUp,
    Hash,
    Layers,
    MousePointer2,
    Zap
} from "lucide-react";
import { formatDistanceToNow, format, isSameDay, parseISO } from "date-fns";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { MediaRenderer } from "../components/post/PlatformPostCards";

const PostEngagement = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [commentText, setCommentText] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD
    const [sortOrder, setSortOrder] = useState("desc"); // new to old
    const [isMuted, setIsMuted] = useState(true);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const videoRef = React.useRef(null);

    const { data: postData, isLoading: postLoading, error: postError } = useGetPostByIdQuery(postId, {
        skip: !postId || postId === "undefined"
    });
    const post = postData?.data;

    const platformThemes = {
        youtube: {
            primary: "from-[#FF0000] to-[#CC0000]",
            secondary: "bg-red-500/10 text-red-500",
            glow: "from-red-500/20 to-orange-500/20",
            border: "border-red-500/20",
            icon: "text-red-500"
        },
        instagram: {
            primary: "from-[#833AB4] via-[#FD1D1D] to-[#FCB045]",
            secondary: "bg-pink-500/10 text-pink-500",
            glow: "from-purple-500/20 via-pink-500/20 to-orange-500/20",
            border: "border-pink-500/20",
            icon: "text-pink-600"
        },
        facebook: {
            primary: "from-[#1877F2] to-[#0051C1]",
            secondary: "bg-blue-500/10 text-blue-500",
            glow: "from-blue-500/20 to-cyan-500/20",
            border: "border-blue-500/20",
            icon: "text-blue-600"
        },
        linkedin: {
            primary: "from-[#0A66C2] to-[#004182]",
            secondary: "bg-[#0A66C2]/10 text-[#0A66C2]",
            glow: "from-blue-600/20 to-indigo-600/20",
            border: "border-[#0A66C2]/20",
            icon: "text-[#0A66C2]"
        },
        x: {
            primary: "from-slate-900 to-black dark:from-slate-100 dark:to-white",
            secondary: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
            glow: "from-slate-400/20 to-slate-600/20",
            border: "border-slate-500/20",
            icon: "text-slate-900 dark:text-slate-100"
        }
    };

    const theme = platformThemes[post?.platform?.toLowerCase()] || platformThemes.youtube;

    const { 
        data: statsData, 
        isLoading: statsLoading, 
        refetch: refetchStats 
    } = useGetPostEngagementQuery(postId, { skip: !post });

    const { 
        data: commentsData, 
        isLoading: commentsLoading 
    } = useGetPostCommentsQuery(postId, { skip: !post });

    const [addComment, { isLoading: isPosting }] = useAddPostCommentMutation();
    const [likeComment, { isLoading: isLiking }] = useLikePostCommentMutation();

    const stats = statsData?.data;
    const rawComments = commentsData?.data || [];

    const filteredComments = rawComments
        .filter(c => {
            const matchesSearch = c.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                c.text.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesDate = !dateFilter || isSameDay(parseISO(c.publishedAt), parseISO(dateFilter));
            
            return matchesSearch && matchesDate;
        })
        .sort((a, b) => {
            const dateA = new Date(a.publishedAt);
            const dateB = new Date(b.publishedAt);
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            await addComment({
                postId: post._id,
                text: commentText,
                parentId: replyTo?.threadId || replyTo?.id // Use threadId for top-level, id for replies (though YouTube usually wants Thread ID)
            }).unwrap();
            
            toast.success(replyTo ? "Reply posted" : "Comment posted");
            setCommentText("");
            setReplyTo(null);
        } catch (err) {
            toast.error(err?.data?.message || "Failed to post comment");
        }
    };

    const handleLikeComment = async (commentId, currentRating) => {
        console.log(`Liking comment ID: ${commentId}, Current Rating: ${currentRating}`);
        try {
            // If already liked, set to 'none' to unlike, otherwise 'like'
            const newRating = currentRating === "like" ? "none" : "like";
            await likeComment({
                postId: post._id,
                commentId,
                rating: newRating
            }).unwrap();
            
            toast.success(newRating === "like" ? "Comment liked" : "Like removed");
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update like");
        }
    };

    if (postLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
                </div>
                <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Syncing Live Data...</p>
            </div>
        );
    }

    if (postError || !post) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <h2 className="text-2xl font-semibold">Post Not Found</h2>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 pb-12">
            {/* Header / Navigation */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(-1)}
                            className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <Separator orientation="vertical" className="h-8 hidden md:block" />
                        <div className="hidden sm:block">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h1 className={cn("text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r", theme.primary)}>Post Engagement</h1>
                                <Badge variant="secondary" className={cn("border-none text-[9px] font-bold uppercase px-2", theme.secondary)}>Live</Badge>
                            </div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Globe className="w-3 h-3 text-indigo-400" />
                                {post?.platform} • {post?.platformPostId}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl border-slate-200 dark:border-slate-800 font-semibold text-xs uppercase tracking-widest hidden md:flex"
                            onClick={() => {
                                const urls = {
                                    youtube: `https://www.youtube.com/watch?v=${post.platformPostId}`,
                                    instagram: `https://www.instagram.com/p/${post.platformPostId}`,
                                    facebook: `https://www.facebook.com/${post.platformPostId}`,
                                    x: `https://twitter.com/i/status/${post.platformPostId}`,
                                    linkedin: `https://www.linkedin.com/feed/update/${post.platformPostId}`
                                };
                                window.open(urls[post.platform] || "#", '_blank');
                            }}
                        >
                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                            Open On {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                        </Button>
                        <Button 
                            className={cn("rounded-xl font-semibold text-xs uppercase tracking-widest shadow-lg border-none", 
                                post.platform === 'x' ? 'bg-black text-white hover:bg-slate-900' : `bg-gradient-to-r ${theme.primary} text-white shadow-primary/20`
                            )}
                            onClick={refetchStats}
                            disabled={statsLoading}
                        >
                            {statsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Activity className="w-3.5 h-3.5 mr-2" />}
                            Sync Metrics
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Left Column: Redesigned Content Feed */}
                    <div className="lg:col-span-7 space-y-10">
                        {/* Immersive Video Player Section */}
                        <div className="relative group">
                            {/* Decorative Background Glow */}
                            <div className={cn("absolute -inset-4 bg-gradient-to-r rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-700", theme.glow)} />
                            
                            <Card className="relative overflow-hidden border-none shadow-2xl bg-slate-950 rounded-[2.5rem] border-4 border-white/10 dark:border-white/5">
                                <div className="aspect-video bg-slate-950 flex items-center justify-center relative overflow-hidden">
                                    <MediaRenderer 
                                        post={post}
                                        isMuted={isMuted}
                                        setIsMuted={setIsMuted}
                                        currentMediaIndex={currentMediaIndex}
                                        setCurrentMediaIndex={setCurrentMediaIndex}
                                        videoRef={videoRef}
                                        objectFit="contain"
                                    />
                                    
                                    {/* Platform Overlay Badge */}
                                    <div className="absolute top-6 left-6 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2 pointer-events-none z-20">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{post.platform} Live</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Redesigned Metrics & Post Info */}
                        <div className="space-y-8 px-2">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-6">
                                <NewMetricCard 
                                    icon={<Eye className="w-5 h-5" />} 
                                    label={post.platform === "x" ? "Impressions" : (post.platform === "youtube" ? "Total Views" : "Reach")} 
                                    value={stats?.views} 
                                    color={post.platform === 'youtube' ? 'red' : 'blue'} 
                                    trend="+12%"
                                />
                                <NewMetricCard 
                                    icon={<Heart className="w-5 h-5" />} 
                                    label={post.platform === "x" ? "Likes" : "Engagements"} 
                                    value={stats?.likes} 
                                    color={post.platform === 'instagram' ? 'rose' : (post.platform === 'linkedin' ? 'indigo' : 'rose')} 
                                    trend="+5%"
                                />
                                <NewMetricCard 
                                    icon={<MessageSquare className="w-5 h-5" />} 
                                    label="Total Comments" 
                                    value={stats?.comments} 
                                    color={post.platform === 'facebook' ? 'blue' : 'emerald'} 
                                    trend="+8%"
                                />
                            </div>

                            {/* Post Content & Creator Card */}
                            <Card className={cn("border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 overflow-hidden relative border-t-4", theme.border)}>
                                {/* Subtle Texture Overlay */}
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                                
                                <div className="relative space-y-10">
                                    {/* Creator Info */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            {(() => {
                                                const creator = post.socialAccountId;
                                                const displayName = creator?.displayName || "Content Creator";
                                                const profilePic = creator?.thumbnail || creator?.avatar || creator?.picture || creator?.metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                                                
                                                return (
                                                    <>
                                                        <div className="relative">
                                                            <div className={cn("absolute -inset-1 bg-gradient-to-tr rounded-2xl blur opacity-30", theme.primary)} />
                                                            <Avatar className="w-14 h-14 rounded-2xl border-2 border-white dark:border-slate-800 shadow-lg relative">
                                                                <AvatarImage src={profilePic} />
                                                                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 font-bold">{displayName[0]}</AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold tracking-tight">{displayName}</h3>
                                                            <div className="flex items-center gap-2 text-slate-400">
                                                                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                                                                <span className="text-[11px] font-semibold uppercase tracking-widest">@{creator?.platformUserName || "YouTube Admin"}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className="hidden sm:flex gap-2">
                                            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{format(new Date(post.scheduledAt), "MMM d, yyyy")}</span>
                                            </div>
                                            <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{formatDistanceToNow(new Date(post.scheduledAt))} ago</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Caption & Content Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-5 bg-gradient-to-b from-primary to-indigo-500 rounded-full" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Published Caption</span>
                                        </div>
                                        <div className="relative">
                                            <p className="text-xl text-slate-700 dark:text-slate-200 leading-[1.8] font-normal italic">
                                                "{post.caption}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tags & Metadata Footer */}
                                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6">
                                        <div className="flex flex-wrap gap-2">
                                            {post.youtubeTags?.map(tag => (
                                                <div key={tag} className="px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold text-[10px] border border-slate-100 dark:border-slate-700 flex items-center gap-2 hover:bg-primary/5 hover:text-primary transition-colors cursor-default">
                                                    <Hash className="w-3 h-3 opacity-50" />
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <Zap className="w-4 h-4 text-amber-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">High Engagement</span>
                                            </div>
                                            <Separator orientation="vertical" className="h-4" />
                                            <div className="flex items-center gap-1.5 text-primary">
                                                <MousePointer2 className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Active Links</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Interaction Section */}
                    <div className="lg:col-span-5 h-full lg:sticky lg:top-28">
                        <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white dark:bg-slate-900 rounded-[2.5rem] h-[calc(100vh-160px)] flex flex-col overflow-hidden border border-white dark:border-slate-800">
                            <CardHeader className="bg-white dark:bg-slate-900 px-6 py-4 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-[16px] font-bold tracking-tight">Comments</h2>
                                        <span className="text-[14px] text-slate-400 font-medium">{filteredComments.length}</span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                                        className="h-8 gap-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all px-2"
                                    >
                                        <SortDesc className="w-4 h-4" />
                                        <span className="text-[12px] font-bold uppercase tracking-wider">Sort by</span>
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <Input 
                                            placeholder="Search comments..." 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-9 pl-9 bg-slate-50 dark:bg-slate-950 border-none rounded-lg text-[13px] focus-visible:ring-1 focus-visible:ring-primary/30"
                                        />
                                    </div>
                                    <div className="relative shrink-0">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                        <Input 
                                            type="date"
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            className="h-9 pl-9 pr-2 bg-slate-50 dark:bg-slate-950 border-none rounded-lg text-[11px] focus-visible:ring-1 focus-visible:ring-primary/30 w-[130px]"
                                        />
                                        {dateFilter && (
                                            <button 
                                                onClick={() => setDateFilter("")}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-[#fafafa] dark:bg-slate-950/30">
                                <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                                    {commentsLoading ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300 py-20">
                                            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Syncing Conversations...</p>
                                        </div>
                                    ) : filteredComments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-10 text-slate-300 py-20">
                                            <div className="relative">
                                                <div className="w-28 h-28 rounded-[2.5rem] bg-white dark:bg-slate-900 flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-800 rotate-12">
                                                    <MessageCircle className="w-12 h-12 text-primary opacity-20" />
                                                </div>
                                                <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center border border-white dark:border-slate-800 -rotate-12 shadow-lg">
                                                    <TrendingUp className="w-6 h-6 text-primary opacity-40" />
                                                </div>
                                            </div>
                                            <div className="text-center space-y-3">
                                                <p className="text-2xl font-bold text-slate-400 tracking-tight">No results found</p>
                                                <p className="text-sm font-normal text-slate-400 max-w-[240px] mx-auto leading-relaxed">We couldn't find any comments matching your search criteria.</p>
                                                <Button variant="ghost" onClick={() => { setSearchQuery(""); setDateFilter(""); }} className="text-primary font-bold uppercase text-[10px] tracking-widest mt-4">Reset Filters</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-12 pb-10">
                                            {filteredComments.map(comment => (
                                                <RedesignedCommentItem 
                                                    key={comment.id} 
                                                    comment={comment} 
                                                    onLike={(id, rating) => handleLikeComment(id, rating)}
                                                    onReply={() => {
                                                        setReplyTo(comment);
                                                        const cleanAuthor = comment.author.replace(/^@+/, '');
                                                        setCommentText(`@${cleanAuthor} `);
                                                        setTimeout(() => {
                                                            const input = document.getElementById('comment-input');
                                                            if (input) {
                                                                input.focus();
                                                                input.setSelectionRange(input.value.length, input.value.length);
                                                            }
                                                        }, 10);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Interaction Input Section (YouTube Mobile Style) */}
                                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 z-10">
                                    <div className="max-w-3xl mx-auto flex gap-4 items-start">
                                        <Avatar className="w-10 h-10 shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <AvatarImage src={post.socialAccountId?.metadata?.thumbnail} />
                                            <AvatarFallback className="bg-primary/5 text-primary font-bold">{post.socialAccountId?.displayName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        
                                        <div className="flex-1 space-y-3">
                                            {replyTo && (
                                                <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                                                    <span className="text-[11px] font-medium text-slate-500">Replying to <b className="text-primary">{replyTo.author}</b></span>
                                                    <X className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => { setReplyTo(null); setCommentText(""); }} />
                                                </div>
                                            )}
                                            
                                            <form onSubmit={handlePostComment} className="relative group">
                                                <textarea 
                                                    id="comment-input"
                                                    rows={1}
                                                    placeholder="Add a comment..."
                                                    value={commentText}
                                                    onChange={(e) => {
                                                        setCommentText(e.target.value);
                                                        e.target.style.height = 'inherit';
                                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                                    }}
                                                    className="w-full bg-transparent border-b-[1.5px] border-slate-200 dark:border-slate-800 focus:border-primary transition-colors focus:ring-0 text-[14px] py-1 px-0 resize-none max-h-32 scrollbar-hide font-normal placeholder:text-slate-400"
                                                />
                                                <div className="flex justify-end mt-2">
                                                    <Button 
                                                        type="submit"
                                                        disabled={!commentText.trim() || isPosting}
                                                        size="sm"
                                                        className="h-8 px-4 rounded-full bg-primary hover:bg-primary/90 text-[12px] font-bold border-none"
                                                    >
                                                        {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : replyTo ? "Reply" : "Comment"}
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

const NewMetricCard = ({ icon, label, value, color, trend }) => (
    <div className={cn(
        "group relative p-7 rounded-[2.5rem] border-2 transition-all duration-500 hover:translate-y-[-6px] shadow-lg overflow-hidden",
        color === "blue" ? "bg-blue-50/10 border-blue-100/20 text-blue-600 dark:bg-blue-500/5 dark:border-blue-500/10 dark:text-blue-400 shadow-blue-500/5" :
        color === "rose" ? "bg-rose-50/10 border-rose-100/20 text-rose-600 dark:bg-rose-500/5 dark:border-rose-500/10 dark:text-rose-400 shadow-rose-500/5" :
        "bg-emerald-50/10 border-emerald-100/20 text-emerald-600 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:text-emerald-400 shadow-emerald-500/5"
    )}>
        {/* Background Decorative Pattern */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-full translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-inherit/10 group-hover:scale-110 transition-transform duration-500">
                    {React.cloneElement(icon, { className: "w-6 h-6" })}
                </div>
                <Badge className={cn(
                    "rounded-lg px-2 py-0.5 border-none font-bold text-[9px] tabular-nums",
                    color === "blue" ? "bg-blue-500/10 text-blue-500" :
                    color === "rose" ? "bg-rose-500/10 text-rose-500" :
                    "bg-emerald-500/10 text-emerald-500"
                )}>
                    {trend}
                </Badge>
            </div>
            <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 block">{label}</span>
                <div className="text-4xl font-bold tabular-nums tracking-tighter group-hover:scale-[1.02] transition-transform origin-left duration-500">
                    {value?.toLocaleString() || 0}
                </div>
            </div>
        </div>
    </div>
);

const RedesignedCommentItem = ({ comment, onReply, onLike }) => {
    return (
        <div className="group relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-3 items-start">
                {/* Standard Circular Avatar */}
                <Avatar className="w-10 h-10 shrink-0 shadow-sm border border-slate-100 dark:border-slate-800">
                    <AvatarImage src={comment.authorAvatar} />
                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs">
                        {comment.author[0]}
                    </AvatarFallback>
                </Avatar>

                {/* Comment Content Area */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                            {comment.author}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                            {formatDistanceToNow(new Date(comment.publishedAt))} ago
                        </span>
                    </div>

                    <p 
                        className="text-[14px] text-slate-700 dark:text-slate-300 leading-normal font-normal break-words"
                        dangerouslySetInnerHTML={{ __html: comment.text }}
                    />

                    {/* Minimalist Action Row */}
                    <div className="flex items-center gap-6 pt-1">
                        <button 
                            onClick={() => onLike(comment.id, comment.viewerRating)}
                            className="flex items-center gap-1.5 group/like"
                        >
                            <ThumbsUp className={cn(
                                "w-4 h-4 transition-colors",
                                comment.viewerRating === "like" ? "text-primary fill-primary" : "text-slate-400 group-hover/like:text-primary"
                            )} />
                            <span className={cn(
                                "text-[11px] font-bold tabular-nums",
                                comment.viewerRating === "like" ? "text-primary" : "text-slate-400 group-hover/like:text-slate-600 dark:group-hover/like:text-slate-200"
                            )}>
                                {comment.likeCount || 0}
                            </span>
                        </button>
                        <button 
                            onClick={onReply}
                            className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-wider"
                        >
                            Reply
                        </button>
                    </div>

                    {/* Threaded Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-5 pl-1 border-l-[1.5px] border-slate-100 dark:border-slate-800 ml-1">
                            {comment.replies.map(reply => (
                                <div key={reply.id} className="flex gap-3 group/reply pt-2">
                                    <Avatar className="w-6 h-6 shrink-0 shadow-sm border border-slate-100 dark:border-slate-800">
                                        <AvatarImage src={reply.authorAvatar} />
                                        <AvatarFallback className="bg-slate-50 dark:bg-slate-900 text-[10px]">
                                            {reply.author?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-0.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{reply.author}</span>
                                                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-bold h-4 border-none px-1 uppercase">ADMIN</Badge>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {formatDistanceToNow(new Date(reply.publishedAt))} ago
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => onLike(reply.id, reply.viewerRating)}
                                                className="flex items-center gap-1 group/reply-like"
                                            >
                                                <ThumbsUp className={cn(
                                                    "w-3 h-3 transition-colors",
                                                    reply.viewerRating === "like" ? "text-primary fill-primary" : "text-slate-300 group-hover/reply-like:text-primary"
                                                )} />
                                                <span className={cn(
                                                    "text-[10px] font-medium tabular-nums",
                                                    reply.viewerRating === "like" ? "text-primary" : "text-slate-300"
                                                )}>
                                                    {reply.likeCount || 0}
                                                </span>
                                            </button>
                                        </div>
                                        <p 
                                            className="text-[13px] text-slate-600 dark:text-slate-400 leading-normal font-normal"
                                            dangerouslySetInnerHTML={{ __html: reply.text }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostEngagement;
