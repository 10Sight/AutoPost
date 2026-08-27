import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useCreateScheduledPostMutation, useUpdateScheduledPostMutation } from "../features/posts/postsApi";
import { useGetConnectedAccountsQuery, useScheduleYouTubePostMutation } from "../features/socialAccounts/socialAccountsApi";
import { useGetGroupsQuery } from "../features/accountGroups/accountGroupsApi";
import { useGetAiKeysQuery } from "../redux/slices/organizationApiSlice";
import { useGetAccountUsageQuery } from "../redux/slices/usageApiSlice";
import { useGetMediaQuery, useGetFoldersQuery } from "../features/media/mediaApi";
import {
    Loader2,
    Calendar as CalendarIcon,
    Image as ImageIcon,
    X,
    Globe,
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    Share2,
    Repeat2,
    AlertCircle,
    Info,
    Youtube,
    ChevronLeft,
    ChevronRight,
    Camera,
    Tv,
    Home,
    Search as SearchIcon,
    PlusSquare,
    PenSquare,
    MoreHorizontal,
    Library,
    Folder,
    Briefcase,
    Coffee,
    Star,
    Laugh,
    Palette,
    Box,
    Zap,
    Square,
    RectangleHorizontal,
    RectangleVertical,
    Clock
} from "lucide-react";
import { validateCaption } from "../utils/validateCaption";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { validateMediaForPlatform } from "../utils/mediaValidation";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "../components/ui/select";
import ThumbnailSelector from "../components/media/ThumbnailSelector";

import PlatformSelector from "../components/post/PlatformSelector";
import SchedulePicker from "../components/post/SchedulePicker";
import SmartSuggestions from "../components/post/SmartSuggestions";
import MediaGrid from "../components/media/MediaGrid";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { cn } from "../lib/utils";
import { Separator } from "../components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";

// Previews
import { MobileMockup, DesktopMockup } from "../components/post/previews/PreviewWrapper";
import InstagramPreview from "../components/post/previews/InstagramPreview";
import FacebookPreview from "../components/post/previews/FacebookPreview";
import TwitterPreview from "../components/post/previews/TwitterPreview";
import MediaUploader from "../components/media/MediaUploader";
import LinkedInPreview from "../components/post/previews/LinkedInPreview";
import YouTubePreview from "../components/post/previews/YouTubePreview";
import MediaEditorModal from "../components/media/editor/MediaEditorModal";
import { Wand2, Sparkles, Languages, Check, ArrowUpRight, Flame, Lock, Film } from "lucide-react";
import { Progress } from "../components/ui/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "../components/ui/tooltip";
import {
    useGenerateTextMutation,
    useGenerateImageMutation,
    useGenerateVideoMutation,
    useLazyGetJobStatusQuery,
} from "../features/ai/aiApi";

const TEXT_MODELS = [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", keyField: "gemini" },
    { value: "gpt-5-mini", label: "GPT-5 Mini", keyField: "openai" },
    { value: "claude-sonnet-5", label: "Claude Sonnet 5", keyField: "anthropic" },
];

const TONE_OPTIONS = [
    { value: "Professional", label: "Professional", Icon: Briefcase },
    { value: "Casual", label: "Casual", Icon: Coffee },
    { value: "Inspirational", label: "Inspirational", Icon: Star },
    { value: "Humorous", label: "Humorous", Icon: Laugh },
    { value: "Bold", label: "Bold", Icon: Flame },
];

const IMAGE_STYLE_OPTIONS = [
    { value: "photorealistic", label: "Photorealistic", Icon: Camera },
    { value: "digital art", label: "Digital Art", Icon: Palette },
    { value: "3D render", label: "3D Render", Icon: Box },
    { value: "neon cyberpunk", label: "Neon Cyberpunk", Icon: Zap },
    { value: "minimalist", label: "Minimalist", Icon: Square },
];

const ASPECT_RATIO_OPTIONS = [
    { value: "1:1", label: "Square (1:1)", Icon: Square },
    { value: "16:9", label: "Landscape (16:9)", Icon: RectangleHorizontal },
    { value: "9:16", label: "Portrait (9:16)", Icon: RectangleVertical },
];

const VIDEO_DURATION_OPTIONS = [
    { value: "5", label: "5 Seconds", Icon: Clock },
    { value: "10", label: "10 Seconds", Icon: Clock },
];

// Small icon-labelled select shared by the AI Studio's tone/style/ratio/duration
// pickers — replaces plain-text <option> emoji prefixes (native <option> can't
// render React icon components at all) with real lucide icons via SelectValue's
// children override, the same pattern GroupFilter.jsx already uses.
const IconSelect = ({ value, onValueChange, options, triggerClassName }) => {
    const selected = options.find((o) => o.value === value);
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={cn("h-8 text-xs", triggerClassName)}>
                <SelectValue placeholder="Select">
                    {selected && (
                        <span className="flex items-center gap-1.5">
                            <selected.Icon className="h-3.5 w-3.5 text-violet-500" />
                            {selected.label}
                        </span>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        <span className="flex items-center gap-2">
                            <opt.Icon className="h-3.5 w-3.5 text-violet-500" />
                            {opt.label}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

const CreatePost = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [createPost, { isLoading: isCreating }] = useCreateScheduledPostMutation();
    const [updatePost, { isLoading: isUpdating }] = useUpdateScheduledPostMutation();
    const [scheduleYouTubePost, { isLoading: isSchedulingYouTube }] = useScheduleYouTubePostMutation();

    // AI Mutation and Polling hooks
    const [generateText, { isLoading: isGeneratingText }] = useGenerateTextMutation();
    const [generateImage] = useGenerateImageMutation();
    const [generateVideo] = useGenerateVideoMutation();
    const [getJobStatus] = useLazyGetJobStatusQuery();
    const { data: aiKeysData } = useGetAiKeysQuery();
    const aiKeyStatus = aiKeysData?.data || {};
    const { data: usageData } = useGetAccountUsageQuery();
    const aiUsage = usageData?.data?.usage;
    const isEditing = location.state?.isEditing;
    const editingPostId = location.state?.postId;
    const { data: accountsData } = useGetConnectedAccountsQuery();
    const { data: groupsData } = useGetGroupsQuery();
    
    // Media Library State & Queries
    const [activeFolderId, setActiveFolderId] = useState(null); // null = All Media
    const { data: mediaData, isLoading: isLoadingMedia } = useGetMediaQuery({ 
        limit: 100,
        folderId: activeFolderId 
    });
    const { data: foldersData, isLoading: isLoadingFolders } = useGetFoldersQuery();

    const [selectedGroup, setSelectedGroup] = useState(() => {
        return localStorage.getItem("lastSelectedAccountGroup") || "all";
    });
    const [selectedAccount, setSelectedAccount] = useState("");

    // Memoized filtered accounts for scalability and performance
    const filteredAccounts = React.useMemo(() => {
        if (!accountsData?.data) return [];
        if (selectedGroup === "all") return accountsData.data;
        
        const group = groupsData?.data?.find(g => g._id === selectedGroup);
        if (!group) return accountsData.data;

        // Ensure we handle populated accounts from the group
        return group.accounts || [];
    }, [accountsData, groupsData, selectedGroup]);

    // Update persistence when group changes
    useEffect(() => {
        if (selectedGroup) {
            localStorage.setItem("lastSelectedAccountGroup", selectedGroup);
        }
    }, [selectedGroup]);

    // Clear selected account if it's no longer in the filtered list
    useEffect(() => {
        if (selectedAccount && !filteredAccounts.some(acc => acc._id === selectedAccount)) {
            setSelectedAccount("");
        }
    }, [filteredAccounts, selectedAccount]);
    
    // Get currently selected account object
    const selectedAccountObj = accountsData?.data?.find(a => String(a._id) === String(selectedAccount));
    const displayName = selectedAccountObj?.platformUserName || selectedAccountObj?.channelTitle || (selectedAccountObj?.platform === 'x' ? '@your_handle' : 'Your Page Name');
    const avatarName = selectedAccountObj?.platformUserName || selectedAccountObj?.channelTitle || 'User';
    const avatarUrl = selectedAccountObj?.avatarUrl;
    const [selectedMediaIds, setSelectedMediaIds] = useState([]);
    const [selectedThumbnail, setSelectedThumbnail] = useState(null);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [caption, setCaption] = useState("");
    // Initialize with current date/time to avoid issues with date manipulation
    const [scheduledAt, setScheduledAt] = useState(new Date().toISOString());
    const [isEvergreen, setIsEvergreen] = useState(false);
    const [evergreenInterval, setEvergreenInterval] = useState(30);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState("mobile"); // 'mobile' | 'desktop'
    const [previewPlatform, setPreviewPlatform] = useState("facebook");
    const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [], charCount: 0, maxCharacters: 2200 });
    const [postType, setPostType] = useState("post"); // 'post' | 'story' | 'reel' | 'short'
    const [mediaValidation, setMediaValidation] = useState({ isValid: true, warnings: [], errors: [] });

    // YouTube Specific State
    const [youtubeTitle, setYoutubeTitle] = useState("");
    const [youtubeDescription, setYoutubeDescription] = useState("");
    const [youtubeTags, setYoutubeTags] = useState("");
    const [youtubePrivacy, setYoutubePrivacy] = useState("public");
    const [youtubeCategory, setYoutubeCategory] = useState("22"); // People & Blogs
    const [publishAt, setPublishAt] = useState("");

    const [activeTab, setActiveTab] = useState("editor"); // 'editor' | 'preview'
    // Professional Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedMediaForEdit, setSelectedMediaForEdit] = useState(null);

    // ==========================================
    // AI CONTENT STUDIO - SAAS BYOK STATE & LOGIC
    // ==========================================
    const [aiActiveTab, setAiActiveTab] = useState("text"); // "text" | "image" | "video"
    const [aiModel, setAiModel] = useState("gemini-2.5-flash");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiTone, setAiTone] = useState("Professional");
    const [aiEmojis, setAiEmojis] = useState(true);
    const [aiHashtags, setAiHashtags] = useState(3);
    const [aiImageStyle, setAiImageStyle] = useState("photorealistic");
    const [aiAspectRatio, setAiAspectRatio] = useState("1:1");
    const [aiVideoDuration, setAiVideoDuration] = useState(10);
    
    // Polling states for background jobs
    const [aiJobId, setAiJobId] = useState(null);
    const [aiJobStatus, setAiJobStatus] = useState(null); // null | "pending" | "processing" | "completed" | "failed"
    const [aiJobResult, setAiJobResult] = useState(null);
    const [aiJobSource, setAiJobSource] = useState(null); // "generated" | "stock" — how the video result was actually produced
    const [aiJobError, setAiJobError] = useState(null);
    const [aiProgressMessage, setAiProgressMessage] = useState("");

    // Generated text result state
    const [generatedTextResult, setGeneratedTextResult] = useState("");

    // Upsell modal state
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);

    const handleTextGenerate = async () => {
        if (!aiPrompt) {
            toast.error("Please enter a prompt for your caption");
            return;
        }
        try {
            const result = await generateText({
                prompt: aiPrompt,
                tone: aiTone,
                includeEmojis: aiEmojis,
                hashtagCount: aiHashtags,
                model: aiModel
            }).unwrap();
            
            setGeneratedTextResult(result.data.text);
            toast.success("AI Caption generated successfully!");
        } catch (err) {
            console.error("Text generation failed", err);
            if (err.status === 403 || err.data?.message?.includes("limit reached")) {
                setIsUpsellModalOpen(true);
            } else {
                toast.error(err.data?.message || "Failed to generate caption. Please try again.");
            }
        }
    };

    const startJobPolling = (jobId) => {
        setAiJobStatus("pending");
        setAiProgressMessage("Queueing generation...");

        let pollInterval = setInterval(async () => {
            try {
                // Call the lazy RTK trigger
                const response = await getJobStatus(jobId).unwrap();
                const job = response.data;

                setAiJobStatus(job.status);

                if (job.status === "processing") {
                    if (job.type === "image") {
                        setAiProgressMessage("Drawing your high-res image...");
                    } else if (aiKeyStatus.runway) {
                        setAiProgressMessage("Generating your video with Runway AI (this can take a few minutes)...");
                    } else {
                        setAiProgressMessage("No video AI key configured — matching a stock clip instead...");
                    }
                } else if (job.status === "completed") {
                    clearInterval(pollInterval);
                    setAiJobResult(job.result);
                    setAiJobSource(job.source);
                    setAiProgressMessage("");
                    toast.success("AI Media generated and uploaded successfully!");
                } else if (job.status === "failed") {
                    clearInterval(pollInterval);
                    setAiJobError(job.error || "AI generation failed.");
                    setAiProgressMessage("");
                    toast.error(job.error || "AI generation failed.");
                }
            } catch (err) {
                clearInterval(pollInterval);
                console.error("Polling job failed", err);
                setAiJobStatus("failed");
                setAiJobError("Network polling error. Please try again.");
                setAiProgressMessage("");
            }
        }, 2000); // Poll every 2 seconds
    };

    const handleMediaGenerate = async (type) => {
        if (!aiPrompt) {
            toast.error(`Please enter a prompt for your ${type}`);
            return;
        }

        setAiJobId(null);
        setAiJobStatus("pending");
        setAiJobResult(null);
        setAiJobSource(null);
        setAiJobError(null);
        setAiProgressMessage("Queueing generation...");

        try {
            let response;
            if (type === "image") {
                response = await generateImage({
                    prompt: aiPrompt,
                    style: aiImageStyle,
                    aspectRatio: aiAspectRatio
                }).unwrap();
            } else {
                response = await generateVideo({
                    prompt: aiPrompt,
                    aspectRatio: aiAspectRatio,
                    duration: aiVideoDuration
                }).unwrap();
            }

            const jobId = response.data.jobId;
            setAiJobId(jobId);
            startJobPolling(jobId);

        } catch (err) {
            console.error("Media generation initiation failed", err);
            setAiJobStatus(null);
            setAiProgressMessage("");
            if (err.status === 403 || err.data?.message?.includes("limit reached")) {
                setIsUpsellModalOpen(true);
            } else {
                toast.error(err.data?.message || "Failed to initiate AI generation.");
            }
        }
    };

    useEffect(() => {
        const platform = accountsData?.data?.find(a => a._id === selectedAccount)?.platform || previewPlatform;
        if (platform) setPreviewPlatform(platform);
    }, [selectedAccount, accountsData]);

    useEffect(() => {
        const result = validateCaption(caption, previewPlatform);
        setValidation(result);

        // Auto-fill YouTube title/description if empty
        if (previewPlatform === 'youtube') {
            const lines = caption.split('\n');
            if (lines.length > 0) {
                if (!youtubeTitle || youtubeTitle === lines[0]) setYoutubeTitle(lines[0].substring(0, 100));
                if (!youtubeDescription || youtubeDescription === lines.slice(1).join('\n')) setYoutubeDescription(lines.slice(1).join('\n'));
            }
        }
    }, [caption, previewPlatform, youtubeTitle, youtubeDescription]);

    useEffect(() => {
        if (selectedMediaIds.length > 0 && previewPlatform) {
            // Validate all selected media
            const allWarnings = [];
            const allErrors = [];
            selectedMediaIds.forEach((media, idx) => {
                const result = validateMediaForPlatform(media, previewPlatform, postType);
                if (result.warnings) allWarnings.push(...result.warnings.map(w => `Item ${idx+1}: ${w}`));
                if (result.errors) allErrors.push(...result.errors.map(e => `Item ${idx+1}: ${e}`));
            });
            
            // Format specific rules
            if ((postType === "story" || postType === "short") && selectedMediaIds.length > 1) {
                allErrors.push(`${postType === "story" ? "Stories" : "Shorts"} do not support multiple media items. Please select only one.`);
            }

            // Platform specific rules
            if (previewPlatform === "youtube" && selectedMediaIds.length > 1) {
                allErrors.push("YouTube does not support multiple media items in a single post.");
            }
            const hasVideo = selectedMediaIds.some(m => m.type === "video");
            const hasImage = selectedMediaIds.some(m => m.type === "image");
            if (hasVideo && hasImage) {
                allErrors.push("Mixed media (photos + videos) is not natively supported. Please select only photos or only videos.");
            }
            if (previewPlatform === "youtube" && !hasVideo) {
                allErrors.push("YouTube requires a video to post.");
            }

            setMediaValidation({ 
                isValid: allErrors.length === 0, 
                warnings: [...new Set(allWarnings)], 
                errors: [...new Set(allErrors)] 
            });
        } else {
            setMediaValidation({ isValid: true, warnings: [], errors: [] });
        }
    }, [selectedMediaIds, previewPlatform, postType]);

    // Reset preview index when media changes
    useEffect(() => {
        setCurrentPreviewIndex(0);
    }, [selectedMediaIds]);

    // Pre-fill form if data is passed via location.state (e.g. from Retry/Edit)
    useEffect(() => {
        if (location.state?.initialData) {
            const { socialAccountId, mediaId, caption, scheduledAt } = location.state.initialData;
            if (socialAccountId) setSelectedAccount(socialAccountId);
            if (caption) setCaption(caption);
            if (scheduledAt) setScheduledAt(scheduledAt);

            // Media pre-fill
            if (location.state.initialData.mediaIds && mediaData?.data?.media) {
                const initialSelected = [];
                location.state.initialData.mediaIds.forEach(id => {
                    const idToFind = typeof id === 'object' ? id._id : id;
                    const foundMedia = mediaData.data.media.find(m => m._id === idToFind);
                    if (foundMedia) initialSelected.push(foundMedia);
                });
                if (initialSelected.length > 0) setSelectedMediaIds(initialSelected);
            } else if (location.state.initialData.mediaId && mediaData?.data?.media) {
                 const idToFind = typeof location.state.initialData.mediaId === 'object' ? location.state.initialData.mediaId._id : location.state.initialData.mediaId;
                 const foundMedia = mediaData.data.media.find(m => m._id === idToFind);
                 if (foundMedia) setSelectedMediaIds([foundMedia]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, mediaData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAccount) {
            toast.error("Please select a social account");
            return;
        }
        if (selectedMediaIds.length === 0) {
            toast.error("Please select media for your post");
            return;
        }
        if (!scheduledAt) {
            toast.error("Please choose a schedule time");
            return;
        }

        const account = accountsData?.data?.find((a) => a._id === selectedAccount);
        if (!account) return;

        try {
            let result;
            const mappedMediaIds = selectedMediaIds.map(m => m._id);

            if (isEditing && editingPostId) {
                result = await updatePost({
                    postId: editingPostId,
                    caption,
                    postType,
                    mediaIds: mappedMediaIds,
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    changeLog: "Post content updated",
                }).unwrap();

                const warnings = result.data?.warnings || [];
                if (warnings.length > 0) {
                    warnings.forEach(w => toast.warning(`Policy Warning: ${w.message}`, { duration: 6000 }));
                }
                toast.success("Post updated successfully!");
            } else if (previewPlatform === 'youtube') {
                result = await scheduleYouTubePost({
                    socialAccountId: selectedAccount,
                    postType: postType,
                    mediaIds: mappedMediaIds,
                    caption,
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    youtubePrivacyStatus: youtubePrivacy,
                    youtubeTags: youtubeTags.split(',').map(tag => tag.trim()).filter(Boolean),
                    youtubeCategoryId: youtubeCategory,
                    publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
                    thumbnailMediaId: selectedThumbnail?._id,
                }).unwrap();
                toast.success("YouTube post scheduled successfully!");
            } else {
                result = await createPost({
                    socialAccountId: selectedAccount,
                    platform: account.platform,
                    postType,
                    mediaIds: mappedMediaIds,
                    caption,
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    thumbnailMediaId: selectedThumbnail?._id,
                    isEvergreen,
                    evergreenInterval: isEvergreen ? evergreenInterval : undefined,
                }).unwrap();

                const warnings = result.data?.warnings || [];
                if (warnings.length > 0) {
                    warnings.forEach(w => toast.warning(`Policy Warning: ${w.message}`, { duration: 6000 }));
                }
                toast.success("Post scheduled successfully!");
            }

            navigate("/dashboard/scheduler");
        } catch (error) {
            console.error(isEditing ? "Failed to update post:" : "Failed to create post:", error);
            // Handle BLOCK actions (403 or specific error data)
            const message = error.data?.message || `Failed to ${isEditing ? 'update' : 'schedule'} post`;
            toast.error(message);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-4 md:space-y-6 p-3 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create New Post</h1>
                
                {/* Mobile Tab Switcher */}
                <div className="lg:hidden flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab("editor")}
                        className={cn(
                            "flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer",
                            activeTab === "editor" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"
                        )}
                    >
                        <PenSquare className="w-3.5 h-3.5" /> Compose
                    </button>
                    <button
                        onClick={() => setActiveTab("preview")}
                        className={cn(
                            "flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer",
                            activeTab === "preview" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"
                        )}
                    >
                        <Globe className="w-3.5 h-3.5" /> Preview
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Editor Column */}
                <div className={cn("lg:col-span-7 space-y-6", activeTab !== "editor" && "hidden lg:block")}>
                    
                    {/* ========================================== */}
                    {/* AI CONTENT STUDIO GLASSMORPHIC INTERFACE */}
                    {/* ========================================== */}
                    <Card className="border-none shadow-lg bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/40 dark:from-violet-950/20 dark:via-gray-900/60 dark:to-indigo-950/10 backdrop-blur-md border border-violet-100/50 dark:border-violet-900/20 animate-in fade-in duration-300">
                        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-lg font-semibold tracking-tight text-violet-700 dark:text-violet-300 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-500 animate-pulse animate-duration-1000" />
                                    AI Content Studio
                                </CardTitle>
                                <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                                    Create professional posts, pictures, and video clips in seconds.
                                </CardDescription>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                                {aiUsage && (
                                    <div className="flex items-center gap-2 w-40" title={`${aiUsage.aiUsed} of ${aiUsage.aiLimit} monthly AI generations used`}>
                                        <Progress value={Math.min(100, (aiUsage.aiUsed / aiUsage.aiLimit) * 100)} className="h-1.5 flex-1" />
                                        <span className="text-[9px] font-semibold text-muted-foreground whitespace-nowrap">
                                            {aiUsage.aiUsed}/{aiUsage.aiLimit}
                                        </span>
                                    </div>
                                )}
                                <TooltipProvider>
                                    <div className="w-40">
                                        <Select value={aiModel} onValueChange={setAiModel}>
                                            <SelectTrigger className="h-8 text-[11px] font-medium border-violet-200/60 dark:border-violet-800/40 bg-white/60 dark:bg-gray-900/60">
                                                <SelectValue placeholder="AI Model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TEXT_MODELS.map((m) => {
                                                    const locked = !aiKeyStatus[m.keyField];
                                                    if (!locked) {
                                                        return (
                                                            <SelectItem key={m.value} value={m.value} className="text-[11px] font-medium">
                                                                {m.label}
                                                            </SelectItem>
                                                        );
                                                    }
                                                    return (
                                                        <Tooltip key={m.value}>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center justify-between gap-2 px-2 py-1.5 mx-1 text-[11px] text-muted-foreground/50 cursor-not-allowed rounded-sm select-none">
                                                                    <span>{m.label}</span>
                                                                    <Lock className="h-3 w-3" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="left" className="text-xs max-w-[180px]">
                                                                🔒 Add a key in Settings → AI Keys to use {m.label}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TooltipProvider>
                                {!aiKeyStatus[TEXT_MODELS.find(m => m.value === aiModel)?.keyField] && (
                                    <Link to="/dashboard/org-settings?tab=ai" className="text-[10px] font-medium text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                                        <Lock className="h-2.5 w-2.5" /> Add key for this model
                                    </Link>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Tab selector */}
                            <div className="flex bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setAiActiveTab("text")}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                        aiActiveTab === "text" ? "bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    <PenSquare className="w-3.5 h-3.5" /> Text / Captions
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAiActiveTab("image")}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                        aiActiveTab === "image" ? "bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    <ImageIcon className="w-3.5 h-3.5" /> AI Images
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAiActiveTab("video")}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                        aiActiveTab === "video" ? "bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    <Tv className="w-3.5 h-3.5" /> AI Video Clips
                                </button>
                            </div>

                            {/* Prompt Input */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        {aiActiveTab === "text" ? "What is your post about?" : aiActiveTab === "image" ? "Describe the image to generate" : "Describe the video clip to generate"}
                                    </Label>
                                    <span className="text-[10px] text-muted-foreground">{aiPrompt.length}/500</span>
                                </div>
                                <Textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value.substring(0, 500))}
                                    placeholder={
                                        aiActiveTab === "text" 
                                        ? "e.g. Write an exciting product update post for our new automated scheduler tool..." 
                                        : aiActiveTab === "image" 
                                        ? "e.g. Minimalist design showing neon laptop and workspace with purple background, photorealistic..." 
                                        : "e.g. Cinematic slow-motion drone flyover of a cozy office workspace..."
                                    }
                                    className="min-h-[75px] max-h-[120px] text-xs resize-none bg-white/40 dark:bg-gray-900/40 focus-visible:ring-violet-500/20"
                                />
                            </div>

                            {/* Tab Options */}
                            {aiActiveTab === "text" && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Copywriting Tone</Label>
                                        <IconSelect value={aiTone} onValueChange={setAiTone} options={TONE_OPTIONS} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Hashtags ({aiHashtags})</Label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            value={aiHashtags}
                                            onChange={(e) => setAiHashtags(parseInt(e.target.value))}
                                            className="w-full h-8 cursor-pointer accent-violet-600"
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-center items-center">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Emojis</Label>
                                        <div className="flex items-center gap-2 h-8">
                                            <Switch
                                                checked={aiEmojis}
                                                onCheckedChange={setAiEmojis}
                                            />
                                            <span className="text-[10px] text-muted-foreground">{aiEmojis ? "On" : "Off"}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {aiActiveTab === "image" && (
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Image Style</Label>
                                        <IconSelect value={aiImageStyle} onValueChange={setAiImageStyle} options={IMAGE_STYLE_OPTIONS} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Aspect Ratio</Label>
                                        <IconSelect value={aiAspectRatio} onValueChange={setAiAspectRatio} options={ASPECT_RATIO_OPTIONS} />
                                    </div>
                                </div>
                            )}

                            {aiActiveTab === "video" && (
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Aspect Ratio</Label>
                                        <IconSelect value={aiAspectRatio} onValueChange={setAiAspectRatio} options={ASPECT_RATIO_OPTIONS} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Duration</Label>
                                        <IconSelect
                                            value={String(aiVideoDuration)}
                                            onValueChange={(v) => setAiVideoDuration(parseInt(v))}
                                            options={VIDEO_DURATION_OPTIONS}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Execution Button */}
                            {aiActiveTab === "text" ? (
                                <Button
                                    type="button"
                                    disabled={isGeneratingText || !aiKeyStatus[TEXT_MODELS.find(m => m.value === aiModel)?.keyField]}
                                    onClick={handleTextGenerate}
                                    className="w-full h-9 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-700 hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-violet-200 dark:shadow-none"
                                >
                                    {isGeneratingText ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            AI is copywriting...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate AI Description
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    disabled={aiJobStatus === "pending" || aiJobStatus === "processing"}
                                    onClick={() => handleMediaGenerate(aiActiveTab)}
                                    className="w-full h-9 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-700 hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-violet-200 dark:shadow-none"
                                >
                                    {aiJobStatus === "pending" || aiJobStatus === "processing" ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Generating Media Job...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate AI {aiActiveTab === "image" ? "Image" : "Video"}
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* Progressive Loading Status for Async Media Jobs */}
                            {(aiJobStatus === "pending" || aiJobStatus === "processing") && (
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-violet-200 dark:border-violet-800 rounded-xl bg-violet-50/20 dark:bg-violet-950/5 animate-pulse mt-2">
                                    <Loader2 className="h-7 w-7 text-violet-600 dark:text-violet-400 animate-spin mb-2" />
                                    <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{aiProgressMessage || "Queueing generation..."}</span>
                                    <span className="text-[9px] text-muted-foreground mt-1">Non-blocking background runner. It takes about 10–30s.</span>
                                </div>
                            )}

                            {/* Image/Video Fail Response display */}
                            {aiJobStatus === "failed" && aiJobError && (
                                <div className="p-3 border border-red-100 dark:border-red-950 rounded-xl bg-red-50/50 dark:bg-red-950/10 text-red-600 text-xs flex items-start gap-2 mt-2 animate-in slide-in-from-top-1">
                                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="font-semibold">AI Generation Blocked</p>
                                        <p className="opacity-90">{aiJobError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Generated Results Area */}
                            {aiActiveTab === "text" && generatedTextResult && (
                                <div className="mt-4 p-4 border border-violet-100 dark:border-violet-900 rounded-xl bg-violet-50/10 dark:bg-violet-950/5 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-widest">Generated Result</span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-7 text-[10px] px-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                                            onClick={() => {
                                                setCaption(generatedTextResult);
                                                toast.success("Successfully copied AI caption into post!");
                                            }}
                                        >
                                            <Check className="h-3 w-3 mr-1" /> Insert into Post
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono bg-white/50 dark:bg-gray-950/40 p-3 rounded-lg border">
                                        {generatedTextResult}
                                    </p>
                                </div>
                            )}

                            {aiActiveTab === "image" && aiJobStatus === "completed" && aiJobResult && (
                                <div className="mt-4 p-4 border border-violet-100 dark:border-violet-900 rounded-xl bg-violet-50/10 dark:bg-violet-950/5 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-widest">Generated Image</span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-7 text-[10px] px-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                                            onClick={() => {
                                                setSelectedMediaIds(prev => {
                                                    if (prev.some(m => m._id === aiJobResult._id)) return prev;
                                                    return [...prev, aiJobResult];
                                                });
                                                toast.success("AI image added to post media!");
                                            }}
                                        >
                                            <Check className="h-3 w-3 mr-1" /> Add to Post
                                        </Button>
                                    </div>
                                    <div className="aspect-video w-full rounded-lg overflow-hidden border bg-black/10 flex items-center justify-center">
                                        <img src={aiJobResult.url} alt="Generated AI Graphic" className="h-full w-full object-cover" />
                                    </div>
                                </div>
                            )}

                            {aiActiveTab === "video" && aiJobStatus === "completed" && aiJobResult && (
                                <div className="mt-4 p-4 border border-violet-100 dark:border-violet-900 rounded-xl bg-violet-50/10 dark:bg-violet-950/5 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-widest">Generated Video</span>
                                            {aiJobSource === "generated" ? (
                                                <Badge className="h-4 px-1.5 text-[9px] font-semibold bg-violet-600 text-white border-none">
                                                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Runway AI
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-semibold text-amber-600 border-amber-200 bg-amber-50">
                                                    <Film className="h-2.5 w-2.5 mr-0.5" /> Stock Match
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-7 text-[10px] px-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                                            onClick={() => {
                                                setSelectedMediaIds(prev => {
                                                    if (prev.some(m => m._id === aiJobResult._id)) return prev;
                                                    return [...prev, aiJobResult];
                                                });
                                                toast.success("AI video added to post media!");
                                            }}
                                        >
                                            <Check className="h-3 w-3 mr-1" /> Add to Post
                                        </Button>
                                    </div>
                                    <div className="aspect-video w-full rounded-lg overflow-hidden border bg-black/10 flex items-center justify-center">
                                        <video src={aiJobResult.url} controls className="h-full w-full object-cover" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="h-fit border-none shadow-md bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Compose Post</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Company / Group</Label>
                                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Groups" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Accounts</SelectItem>
                                                {groupsData?.data?.map((group) => (
                                                    <SelectItem key={group._id} value={group._id}>
                                                        {group.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <PlatformSelector
                                        accounts={filteredAccounts}
                                        selectedAccount={selectedAccount}
                                        onSelect={setSelectedAccount}
                                        className="space-y-2"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Post Type</Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant={postType === "post" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setPostType("post")}
                                            className="rounded-full px-4 h-9 font-semibold transition-all hover:scale-105"
                                        >
                                            <Send className="w-3.5 h-3.5 mr-2" />
                                            Feed Post
                                        </Button>
                                        {(selectedAccountObj?.platform === "instagram" || selectedAccountObj?.platform === "facebook") && (
                                            <Button
                                                type="button"
                                                variant={postType === "story" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPostType("story")}
                                                className="rounded-full px-4 h-9 font-semibold transition-all hover:scale-105"
                                            >
                                                <Camera className="w-3.5 h-3.5 mr-2" />
                                                Story
                                            </Button>
                                        )}
                                        {(selectedAccountObj?.platform === "instagram" || selectedAccountObj?.platform === "facebook") && (
                                            <Button
                                                type="button"
                                                variant={postType === "reel" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPostType("reel")}
                                                className="rounded-full px-4 h-9 font-semibold transition-all hover:scale-105"
                                            >
                                                <Tv className="w-3.5 h-3.5 mr-2" />
                                                Reel
                                            </Button>
                                        )}
                                        {selectedAccountObj?.platform === "youtube" && (
                                            <Button
                                                type="button"
                                                variant={postType === "short" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPostType("short")}
                                                className="rounded-full px-4 h-9 font-semibold transition-all hover:scale-105"
                                            >
                                                <Youtube className="w-3.5 h-3.5 mr-2" />
                                                Short
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1 px-1 italic">
                                        {postType === 'story' && "Note: Stories on Instagram/Facebook do not support captions."}
                                        {postType === 'short' && "YouTube Shorts are ideal for vertical videos under 60 seconds."}
                                        {postType === 'reel' && "Reels are perfect for short, engaging vertical video content."}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Media</Label>
                                    {selectedMediaIds.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {selectedMediaIds.map((media, idx) => (
                                                    <div key={media._id} className="relative group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                                        <div className="aspect-video w-full bg-black/5 flex items-center justify-center">
                                                            {media.type === 'video' ? (
                                                                <video src={media.url} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <img
                                                                    src={media.url}
                                                                    alt={media.originalName}
                                                                    className="h-full w-full object-cover bg-gray-50 dark:bg-gray-900"
                                                                />
                                                            )}
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                            onClick={() => setSelectedMediaIds(prev => prev.filter(m => m._id !== media._id))}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                        <div className="bg-white/90 dark:bg-gray-900/90 px-2 py-1 text-[10px] text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center absolute bottom-0 left-0 right-0">
                                                            <span className="truncate max-w-[80%]">{media.originalName}</span>
                                                            <span className="font-bold">{idx + 1}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Add more button */}
                                                <div 
                                                    className="aspect-video border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                                                    onClick={() => setIsMediaModalOpen(true)}
                                                >
                                                    <div className="flex flex-col items-center gap-1">
                                                        <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-primary" />
                                                        <span className="text-[10px] text-gray-400 group-hover:text-primary">Add More</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                                                <span>{selectedMediaIds.length} item(s) selected</span>
                                                <Button variant="ghost" size="sm" className="h-6" onClick={() => setSelectedMediaIds([])}>Clear All</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center bg-gray-50/50 dark:bg-gray-900/50"
                                        >
                                            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                                                <ImageIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">Add media to your post</p>
                                                <p className="text-xs text-muted-foreground">Select from your library or upload directly</p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                                <Button type="button" variant="outline" onClick={() => setIsMediaModalOpen(true)} className="rounded-xl h-10">
                                                    <Library className="mr-2 h-4 w-4" />
                                                    Browse Library
                                                </Button>
                                                <MediaUploader 
                                                    selectedGroupId={selectedGroup !== "all" ? selectedGroup : undefined}
                                                    onUploadSuccess={(newMedia) => {
                                                        setSelectedMediaIds(prev => {
                                                            if (prev.length >= 10) return prev;
                                                            return [...prev, newMedia];
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Thumbnail Selection for Videos */}
                                    {selectedMediaIds.some(m => m.type === 'video') && (
                                        <div className="mt-6 border-t pt-6">
                                            <ThumbnailSelector 
                                                videoUrl={selectedMediaIds.find(m => m.type === 'video')?.url}
                                                onSelect={setSelectedThumbnail}
                                                selectedThumbnail={selectedThumbnail}
                                                groupId={selectedGroup}
                                            />
                                        </div>
                                    )}

                                    {/* Media Intelligence Warnings */}
                                    {(mediaValidation.warnings.length > 0 || mediaValidation.errors.length > 0) && (
                                        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                            {mediaValidation.errors.map((err, i) => (
                                                <div key={i} className="flex items-start gap-2 text-[11px] text-red-600 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                                                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                    <span>{err}</span>
                                                </div>
                                            ))}
                                            {mediaValidation.warnings.map((warn, i) => (
                                                <div key={i} className="flex items-start gap-2 text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                    <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                    <span>{warn}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="caption">Caption</Label>
                                            {postType === 'story' ? (
                                                <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                                                    <Info className="w-3 h-3 mr-1" />
                                                    Stories don't support captions
                                                </Badge>
                                            ) : selectedAccount && (
                                                <Badge variant="outline" className="text-[10px] h-4">
                                                    {accountsData?.data?.find(a => a._id === selectedAccount)?.platform} mode
                                                </Badge>
                                            )}
                                        </div>
                                        <span className={`text-xs ${validation.charCount > validation.maxCharacters ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                            {validation.charCount} / {validation.maxCharacters}
                                        </span>
                                    </div>
                                    <Textarea
                                        id="caption"
                                        placeholder={postType === 'story' ? "Captions are not supported for stories via API." : "Write a captivating caption..."}
                                        className={`min-h-[150px] resize-none focus-visible:ring-primary/20 p-4 leading-relaxed transition-all ${validation.errors.length > 0 ? 'border-red-300 focus-visible:ring-red-200' : ''} ${postType === 'story' ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        disabled={postType === 'story'}
                                    />

                                    {/* Feedback Area */}
                                    <div className="space-y-2 mt-2">
                                        {validation.errors.map((error, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-100 dark:border-red-900/30">
                                                <X className="h-3 w-3" />
                                                <span>{error}</span>
                                            </div>
                                        ))}
                                        {validation.warnings.map((warning, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md border border-amber-100 dark:border-amber-900/30">
                                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                <span>{warning}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* YouTube Specific Fields */}
                                {previewPlatform === 'youtube' && (
                                    <div className="space-y-4 p-4 rounded-xl bg-red-50/30 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2 mb-2 text-red-600 font-semibold">
                                            <Youtube className="h-4 w-4" />
                                            <span className="text-sm">YouTube Optimization</span>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="yt-title">Video Title</Label>
                                            <Input
                                                id="yt-title"
                                                placeholder="Enter video title (max 100 characters)"
                                                value={youtubeTitle}
                                                onChange={(e) => setYoutubeTitle(e.target.value)}
                                                maxLength={100}
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                Used for the YouTube video title. Defaults to the first line of your caption.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="yt-tags">Tags (comma separated)</Label>
                                            <Input
                                                id="yt-tags"
                                                placeholder="vlog, tutorial, howto..."
                                                value={youtubeTags}
                                                onChange={(e) => setYoutubeTags(e.target.value)}
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                Separate tags with commas. Max 50 tags.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="yt-privacy">Privacy Status</Label>
                                                <select
                                                    id="yt-privacy"
                                                    value={youtubePrivacy}
                                                    onChange={(e) => setYoutubePrivacy(e.target.value)}
                                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                >
                                                    <option value="public">Public</option>
                                                    <option value="unlisted">Unlisted</option>
                                                    <option value="private">Private</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="yt-category">Category</Label>
                                                <select
                                                    id="yt-category"
                                                    value={youtubeCategory}
                                                    onChange={(e) => setYoutubeCategory(e.target.value)}
                                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                >
                                                    <option value="22">People & Blogs</option>
                                                    <option value="20">Gaming</option>
                                                    <option value="27">Education</option>
                                                    <option value="28">Science & Tech</option>
                                                    <option value="1">Film & Animation</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}


                                <SchedulePicker
                                    scheduledAt={scheduledAt}
                                    onChange={setScheduledAt}
                                />
                                <SmartSuggestions
                                    platform={accountsData?.data?.find(a => a._id === selectedAccount)?.platform}
                                    onSelect={(date) => setScheduledAt(date)}
                                />

                                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="evergreen-mode">Evergreen Content</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically repost this content periodically.
                                            </p>
                                        </div>
                                        <Switch
                                            id="evergreen-mode"
                                            checked={isEvergreen}
                                            onCheckedChange={setIsEvergreen}
                                        />
                                    </div>

                                    {isEvergreen && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label htmlFor="interval">Recycle Interval (Days)</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="interval"
                                                    type="number"
                                                    min="1"
                                                    value={evergreenInterval}
                                                    onChange={(e) => setEvergreenInterval(parseInt(e.target.value) || 30)}
                                                    className="w-full"
                                                />
                                                <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Next post will be scheduled {evergreenInterval} days after publication.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] hover:shadow-primary/30"
                                        disabled={isCreating || isUpdating || isSchedulingYouTube || !validation.isValid || !mediaValidation.isValid}
                                    >
                                        {isCreating || isUpdating || isSchedulingYouTube ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                {isEditing ? 'Updating...' : 'Scheduling...'}
                                            </>
                                        ) : (
                                            <>
                                                <CalendarIcon className="mr-2 h-5 w-5" />
                                                {isEditing ? 'Update Post' : 'Schedule Post'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Column - Sticky on Desktop */}
                <div className={cn("lg:col-span-5 space-y-6", activeTab !== "preview" && "hidden lg:block")}>
                    <div className="lg:sticky lg:top-24 space-y-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Live Preview</h3>
                                <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <button
                                        onClick={() => setPreviewMode("mobile")}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${previewMode === "mobile"
                                            ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                                            : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                            }`}
                                    >
                                        Mobile
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode("desktop")}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${previewMode === "desktop"
                                            ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                                            : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                            }`}
                                    >
                                        Desktop
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {['facebook', 'instagram', 'x', 'linkedin', 'youtube'].map((plt) => (
                                    <button
                                        key={plt}
                                        onClick={() => setPreviewPlatform(plt)}
                                        className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-full border transition-all shrink-0 ${previewPlatform === plt
                                            ? "bg-primary text-white border-primary shadow-md"
                                            : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-primary/50"
                                            }`}
                                    >
                                        {plt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Preview Switcher */}
                        {previewMode === "mobile" ? (
                            <MobileMockup platform={previewPlatform}>
                                {(() => {
                                    const props = {
                                        caption,
                                        media: selectedMediaIds,
                                        currentIndex: currentPreviewIndex,
                                        onIndexChange: setCurrentPreviewIndex,
                                        displayName,
                                        avatarName,
                                        avatarUrl,
                                        scheduledAt,
                                        postType
                                    };

                                    switch (previewPlatform) {
                                        case "instagram": return <InstagramPreview {...props} />;
                                        case "facebook": return <FacebookPreview {...props} />;
                                        case "twitter":
                                        case "x": return <TwitterPreview {...props} />;
                                        case "linkedin": return <LinkedInPreview {...props} />;
                                        case "youtube": return <YouTubePreview {...props} />;
                                        default: return <InstagramPreview {...props} />;
                                    }
                                })()}
                            </MobileMockup>
                        ) : (
                            <DesktopMockup>
                                {(() => {
                                    const props = {
                                        caption,
                                        media: selectedMediaIds,
                                        currentIndex: currentPreviewIndex,
                                        onIndexChange: setCurrentPreviewIndex,
                                        displayName,
                                        avatarName,
                                        avatarUrl,
                                        scheduledAt,
                                        postType
                                    };

                                    switch (previewPlatform) {
                                        case "instagram": return <div className="p-0"><InstagramPreview {...props} /></div>;
                                        case "facebook": return <FacebookPreview {...props} />;
                                        case "twitter":
                                        case "x": return <TwitterPreview {...props} />;
                                        case "linkedin": return <LinkedInPreview {...props} />;
                                        case "youtube": return <YouTubePreview {...props} />;
                                        default: return <div className="p-0"><InstagramPreview {...props} /></div>;
                                    }
                                })()}
                            </DesktopMockup>
                        )}
                    </div>
                </div>
            </div>

            {/* Media Selection Dialog */}
            <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
                <DialogContent className="max-w-7xl w-[95vw] h-[90vh] md:h-[85vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-4 md:p-6 pb-2 md:pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <DialogTitle className="text-lg md:text-xl">Select Media Content</DialogTitle>
                                <DialogDescription className="text-[10px] md:text-xs mt-1">
                                    Browse your organization's creative library to find the perfect assets.
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4 justify-between md:justify-end">
                                <MediaUploader 
                                    selectedGroupId={selectedGroup !== "all" ? selectedGroup : undefined}
                                    activeFolderId={activeFolderId}
                                    onUploadSuccess={(newMedia) => {
                                        setSelectedMediaIds(prev => {
                                            if (prev.length >= 10) return prev;
                                            return [...prev, newMedia];
                                        });
                                        setIsMediaModalOpen(false); // Close after direct upload for better UX
                                    }}
                                />
                                <Separator orientation="vertical" className="hidden md:block h-8" />
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="h-6 whitespace-nowrap">
                                        {selectedMediaIds.length} Selected
                                    </Badge>
                                    {selectedMediaIds.length > 0 && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => setSelectedMediaIds([])}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                        {/* Sidebar - Folder Navigation - Responsive: Sidebar on desktop, Horizontal scroll on mobile */}
                        <div className="w-full md:w-64 md:border-r border-b md:border-b-0 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col shrink-0">
                            <div className="hidden md:block p-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Folders
                            </div>
                            <ScrollArea className="flex-1 md:px-3">
                                <div className="flex md:flex-col gap-1 p-2 md:p-0 md:pb-4 overflow-x-auto md:overflow-x-visible no-scrollbar">
                                    {/* Default "All Media" view */}
                                    <button
                                        onClick={() => setActiveFolderId(null)}
                                        className={`whitespace-nowrap flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-medium transition-all shrink-0 ${
                                            activeFolderId === null
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                                        }`}
                                    >
                                        <Library className="h-3 w-3 md:h-4 md:w-4" />
                                        <span>All Assets</span>
                                    </button>

                                    {/* Organization-specific folders */}
                                    {!isLoadingFolders && foldersData?.data?.map((folder) => (
                                        <button
                                            key={folder._id}
                                            onClick={() => setActiveFolderId(folder._id)}
                                            className={`whitespace-nowrap flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2.5 rounded-lg text-[10px] md:text-sm font-medium transition-all shrink-0 ${
                                                activeFolderId === folder._id
                                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                                            }`}
                                        >
                                            <Folder className={`h-3 w-3 md:h-4 md:w-4 ${activeFolderId === folder._id ? "text-white" : "text-gray-400"}`} />
                                            <span className="truncate max-w-[100px] md:max-w-none">{folder.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Main Content Area - Media Grid */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
                            <ScrollArea className="flex-1 p-6">
                                {isLoadingMedia ? (
                                    <div className="flex flex-col items-center justify-center py-32 space-y-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Assets...</p>
                                    </div>
                                ) : (
                                    <MediaGrid
                                        media={mediaData?.data?.media}
                                        gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                                        onSelect={(item) => {
                                            // Handle multi-selection with scalability in mind
                                            setSelectedMediaIds((prev) => {
                                                const isSelected = prev.find(m => m._id === item._id);
                                                if (isSelected) {
                                                    return prev.filter(m => m._id !== item._id);
                                                } else {
                                                    if (prev.length >= 10) {
                                                        toast.error("Maximum 10 media items allowed per post");
                                                        return prev;
                                                    }
                                                    return [...prev, item];
                                                }
                                            });
                                        }}
                                        onEdit={(item) => {
                                            navigate(`/media/editor/${item._id}`);
                                        }}
                                        selectedMediaIds={selectedMediaIds}
                                    />
                                )}
                            </ScrollArea>

                            {/* Sticky Footer for current selection status */}
                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                                <p className="text-xs text-gray-400 font-medium">
                                    {mediaData?.data?.media?.length || 0} items in {activeFolderId ? 'this folder' : 'library'}
                                </p>
                                <Button size="sm" onClick={() => setIsMediaModalOpen(false)}>
                                    Finish Selection
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Upsell Quota Limit Modal */}
            <Dialog open={isUpsellModalOpen} onOpenChange={setIsUpsellModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-gray-950">
                    <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 p-8 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 opacity-10 bg-white size-48 rounded-full pointer-events-none" />
                        <div className="absolute -left-10 -top-10 opacity-10 bg-white size-32 rounded-full pointer-events-none" />
                        <div className="rounded-full bg-white/20 p-3 w-fit mb-4 backdrop-blur-md">
                            <Sparkles className="h-6 w-6 text-yellow-300 animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight leading-snug">AI Credits Exhausted!</h2>
                        <p className="text-white/80 text-xs mt-2 leading-relaxed">
                            You have successfully consumed your monthly limit of 30 free AI generations. Upgrade to premium to unleash unlimited content!
                        </p>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-violet-50 dark:bg-violet-950/30 rounded-lg text-primary">
                                    <Flame className="h-4 w-4 text-violet-600" />
                                </div>
                                <span className="text-sm font-bold">500+ Premium Monthly Generations</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-violet-50 dark:bg-violet-950/30 rounded-lg text-primary">
                                    <Languages className="h-4 w-4 text-violet-600" />
                                </div>
                                <span className="text-sm font-bold">Access Advanced Models (Claude 3.5)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-violet-50 dark:bg-violet-950/30 rounded-lg text-primary">
                                    <Check className="h-4 w-4 text-violet-600" />
                                </div>
                                <span className="text-sm font-bold">Priority Processing speeds</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <Button type="button" variant="ghost" className="h-10 text-xs" onClick={() => setIsUpsellModalOpen(false)}>
                                Keep Free Plan
                            </Button>
                            <Button 
                                type="button"
                                className="h-10 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-md shadow-violet-200"
                                onClick={() => {
                                    setIsUpsellModalOpen(false);
                                    navigate("/dashboard/settings"); // Or billing settings page
                                }}
                            >
                                Upgrade to Pro <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CreatePost;
