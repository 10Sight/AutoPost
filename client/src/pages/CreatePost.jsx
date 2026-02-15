import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { useCreateScheduledPostMutation, useUpdateScheduledPostMutation } from "../features/posts/postsApi";
import { useGetConnectedAccountsQuery } from "../features/socialAccounts/socialAccountsApi";
import { useGetMediaQuery } from "../features/media/mediaApi";
import { useScheduleYouTubePostMutation } from "../features/socialAccounts/socialAccountsApi";
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
    Youtube
} from "lucide-react";
import { validateCaption } from "../utils/validateCaption";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { validateMediaForPlatform } from "../utils/mediaValidation";

import PlatformSelector from "../components/post/PlatformSelector";
import SchedulePicker from "../components/post/SchedulePicker";
import SmartSuggestions from "../components/post/SmartSuggestions";
import MediaGrid from "../components/media/MediaGrid";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";

const CreatePost = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [createPost, { isLoading: isCreating }] = useCreateScheduledPostMutation();
    const [updatePost, { isLoading: isUpdating }] = useUpdateScheduledPostMutation();
    const [scheduleYouTubePost, { isLoading: isSchedulingYouTube }] = useScheduleYouTubePostMutation();
    const isEditing = location.state?.isEditing;
    const editingPostId = location.state?.postId;
    const { data: accountsData } = useGetConnectedAccountsQuery();
    const { data: mediaData } = useGetMediaQuery({ limit: 100 });

    const [selectedAccount, setSelectedAccount] = useState("");
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [caption, setCaption] = useState("");
    // Initialize with current date/time to avoid issues with date manipulation
    const [scheduledAt, setScheduledAt] = useState(new Date().toISOString());
    const [isEvergreen, setIsEvergreen] = useState(false);
    const [evergreenInterval, setEvergreenInterval] = useState(30);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState("mobile"); // 'mobile' | 'desktop'
    const [previewPlatform, setPreviewPlatform] = useState("facebook");
    const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [], charCount: 0, maxCharacters: 2200 });
    const [mediaValidation, setMediaValidation] = useState({ isValid: true, warnings: [], errors: [] });

    // YouTube Specific State
    const [youtubeTitle, setYoutubeTitle] = useState("");
    const [youtubeDescription, setYoutubeDescription] = useState("");
    const [youtubeTags, setYoutubeTags] = useState("");
    const [youtubePrivacy, setYoutubePrivacy] = useState("public");
    const [youtubeCategory, setYoutubeCategory] = useState("22"); // People & Blogs
    const [publishAt, setPublishAt] = useState("");

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
        if (selectedMedia && previewPlatform) {
            const result = validateMediaForPlatform(selectedMedia, previewPlatform);
            setMediaValidation(result);
        } else {
            setMediaValidation({ isValid: true, warnings: [], errors: [] });
        }
    }, [selectedMedia, previewPlatform]);

    // Pre-fill form if data is passed via location.state (e.g. from Retry/Edit)
    useEffect(() => {
        if (location.state?.initialData) {
            const { socialAccountId, mediaId, caption, scheduledAt } = location.state.initialData;
            if (socialAccountId) setSelectedAccount(socialAccountId);
            if (caption) setCaption(caption);
            if (scheduledAt) setScheduledAt(scheduledAt);

            // Media pre-fill is tricky because we only have ID initially, need object for preview.
            // If mediaData is loaded, try to find it.
            if (mediaId && mediaData?.data?.media) {
                // Try to resolve media object from ID if mediaId is object or string
                const idToFind = typeof mediaId === 'object' ? mediaId._id : mediaId;
                const foundMedia = mediaData.data.media.find(m => m._id === idToFind);
                if (foundMedia) setSelectedMedia(foundMedia);
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
        if (!selectedMedia) {
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
            if (isEditing && editingPostId) {
                result = await updatePost({
                    postId: editingPostId,
                    caption,
                    mediaId: selectedMedia._id,
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
                    mediaId: selectedMedia._id,
                    caption,
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    youtubePrivacyStatus: youtubePrivacy,
                    youtubeTags: youtubeTags.split(',').map(tag => tag.trim()).filter(Boolean),
                    youtubeCategoryId: youtubeCategory,
                    publishAt: publishAt ? new Date(publishAt).toISOString() : undefined
                }).unwrap();
                toast.success("YouTube post scheduled successfully!");
            } else {
                result = await createPost({
                    socialAccountId: selectedAccount,
                    platform: account.platform,
                    mediaId: selectedMedia._id,
                    caption,
                    scheduledAt: new Date(scheduledAt).toISOString(),
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
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Editor Column */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="h-fit border-none shadow-md bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Compose Post</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <PlatformSelector
                                    accounts={accountsData?.data}
                                    selectedAccount={selectedAccount}
                                    onSelect={setSelectedAccount}
                                />

                                <div className="space-y-2">
                                    <Label>Media</Label>
                                    {selectedMedia ? (
                                        <div className="relative group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                                            <div className="aspect-video w-full bg-black/5 flex items-center justify-center">
                                                {selectedMedia.type === 'video' ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm mb-2">
                                                            {/* Video Icon placeholder if needed, or just thumbnail */}
                                                        </div>
                                                        <video src={selectedMedia.url} className="h-full w-full object-contain max-h-64" controls />
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={selectedMedia.url}
                                                        alt={selectedMedia.originalName}
                                                        className="h-full w-full object-contain max-h-64 bg-gray-50 dark:bg-gray-900"
                                                    />
                                                )}
                                            </div>

                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                onClick={() => setSelectedMedia(null)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>

                                            <div className="bg-white/90 dark:bg-gray-900/90 p-3 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                                <div className="flex flex-col gap-0.5 max-w-[70%]">
                                                    <span className="truncate">{selectedMedia.originalName}</span>
                                                    {selectedMedia.width && (
                                                        <span className="text-[10px] opacity-70">
                                                            {selectedMedia.width}x{selectedMedia.height} ({selectedMedia.aspectRatio})
                                                            {selectedMedia.duration && ` • ${selectedMedia.duration.toFixed(1)}s`}
                                                        </span>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsMediaModalOpen(true)}>Change</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 bg-gray-50/50 dark:bg-gray-900/50"
                                            onClick={() => setIsMediaModalOpen(true)}
                                        >
                                            <div className="p-4 rounded-full bg-primary/10 text-primary">
                                                <ImageIcon className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">Add Photo or Video</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Click to browse your media library
                                                </p>
                                            </div>
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
                                            {selectedAccount && (
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
                                        placeholder="Write a captivating caption..."
                                        className={`min-h-[150px] resize-none focus-visible:ring-primary/20 p-4 leading-relaxed transition-all ${validation.errors.length > 0 ? 'border-red-300 focus-visible:ring-red-200' : ''
                                            }`}
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
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

                {/* Preview Column - Sticky */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-24 space-y-4">
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
                                {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'].map((plt) => (
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

                        {previewMode === "mobile" ? (
                            /* Phone Mockup Frame */
                            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl ring-1 ring-gray-900/5">
                                <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
                                <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                                <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                                <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                                <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>

                                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-gray-950 flex flex-col">
                                    {/* App Header */}
                                    <div className={`h-12 flex items-center justify-between border-b px-4 shrink-0 rotate-0 ${previewPlatform === 'instagram' ? 'bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800' :
                                        previewPlatform === 'facebook' ? 'bg-[#1877F2] text-white border-none' :
                                            previewPlatform === 'twitter' ? 'bg-black text-white border-gray-800' :
                                                previewPlatform === 'youtube' ? 'bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800' :
                                                    'bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800'
                                        }`}>
                                        <div className="flex items-center gap-2">
                                            {previewPlatform === 'facebook' && <div className="p-1 rounded bg-white"><div className="w-3 h-3 bg-[#1877F2] rounded-sm" /></div>}
                                            {previewPlatform === 'youtube' && <Youtube className="h-4 w-4 text-red-600" />}
                                            <span className="font-bold text-sm capitalize">{previewPlatform} Preview</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 rounded-full bg-current opacity-50" />
                                            <div className="w-1 h-1 rounded-full bg-current opacity-50" />
                                            <div className="w-1 h-1 rounded-full bg-current opacity-50" />
                                        </div>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                                        {/* Dynamic Platform Post Header */}
                                        <div className="flex items-center gap-3 p-3 text-gray-900 dark:text-gray-100">
                                            <div className={`h-8 w-8 ${previewPlatform === 'twitter' || previewPlatform === 'instagram' ? 'rounded-full' : 'rounded-sm'} bg-gray-200 overflow-hidden`}>
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent('User')}&background=random`}
                                                    className="h-full w-full object-cover"
                                                    alt="User"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold">
                                                    {previewPlatform === 'twitter' ? '@your_handle' : 'Your Page Name'}
                                                </span>
                                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    {previewPlatform === 'facebook' ? 'Sponsored • ' : previewPlatform === 'instagram' ? 'Sponsored' : 'Just now • '}
                                                    {previewPlatform === 'facebook' && <Globe className="h-2 w-2" />}
                                                </span>
                                            </div>
                                            <div className="ml-auto text-gray-400">•••</div>
                                        </div>

                                        {/* Post Media */}
                                        <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                            {selectedMedia ? (
                                                selectedMedia.type === 'video' ? (
                                                    <video src={selectedMedia.url} className="h-full w-full object-cover" />
                                                ) : (
                                                    <img src={selectedMedia.url} alt="Post" className="h-full w-full object-cover" />
                                                )
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                                    <ImageIcon className="h-8 w-8 opacity-50" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Post Actions */}
                                        <div className="flex items-center justify-between p-3 pb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-700" />
                                                <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-700" />
                                                <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-700" />
                                            </div>
                                            <div className="h-5 w-5 rounded-full border border-gray-300 dark:border-gray-700" />
                                        </div>

                                        {/* Post Caption */}
                                        <div className="px-3 pb-4 space-y-1">
                                            <div className="text-xs font-semibold flex items-center gap-1">
                                                <span>Liked by</span>
                                                <span className="font-bold">others</span>
                                            </div>
                                            <div className="text-xs leading-relaxed">
                                                {previewPlatform !== 'youtube' && <span className="font-semibold mr-1">your_username</span>}
                                                {previewPlatform === 'youtube' && caption && (
                                                    <div className="mb-2">
                                                        <h4 className="font-bold text-sm line-clamp-2">{caption.split('\n')[0]}</h4>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">123K views • Just now</p>
                                                    </div>
                                                )}
                                                {caption ? (
                                                    <span className={`${previewPlatform === 'youtube' ? 'text-[11px] text-gray-600 dark:text-gray-400 line-clamp-3' : 'whitespace-pre-wrap'}`}>
                                                        {previewPlatform === 'youtube' ? (caption.split('\n').slice(1).join('\n') || caption) : caption}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Write a caption...</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-400 uppercase mt-1">
                                                {scheduledAt ? format(new Date(scheduledAt), 'MMMM d') : 'Just now'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Nav Mock */}
                                    <div className="h-12 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around shrink-0">
                                        <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-800"></div>
                                        <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-800"></div>
                                        <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-800"></div>
                                        <div className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-800"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Desktop Browser Window Mockup */
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden ring-1 ring-gray-900/5">
                                {/* Browser Header */}
                                <div className="h-9 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                                    </div>
                                    <div className="flex-1 mx-4 h-6 bg-white dark:bg-gray-700 rounded text-[10px] text-gray-400 flex items-center px-2 font-mono">
                                        social-media.com/feed
                                    </div>
                                </div>

                                {/* Browser Content - Feed Style */}
                                <div className="p-6 bg-gray-50 dark:bg-gray-950/50 min-h-[400px]">
                                    <div className="max-w-[480px] mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                                        {/* Post Header */}
                                        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                                                <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 p-[2px]">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent('User')}&background=random`}
                                                        className="h-full w-full rounded-full object-cover"
                                                        alt="User"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">your_username</span>
                                                <span className="text-xs text-gray-500">Sponsored • 1h</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                                                <span className="sr-only">Menu</span>
                                                <div className="flex gap-1">
                                                    <div className="h-1 w-1 rounded-full bg-gray-600"></div>
                                                    <div className="h-1 w-1 rounded-full bg-gray-600"></div>
                                                    <div className="h-1 w-1 rounded-full bg-gray-600"></div>
                                                </div>
                                            </Button>
                                        </div>

                                        {/* Post Media */}
                                        <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                            {selectedMedia ? (
                                                selectedMedia.type === 'video' ? (
                                                    <video src={selectedMedia.url} className="h-full w-full object-cover" />
                                                ) : (
                                                    <img src={selectedMedia.url} alt="Post" className="h-full w-full object-cover" />
                                                )
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                                    <ImageIcon className="h-12 w-12 opacity-50" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Post Actions & Caption */}
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-700" />
                                                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-700" />
                                                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-700" />
                                                </div>
                                                <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-700" />
                                            </div>

                                            <div className="space-y-1">
                                                <div className="text-sm font-semibold">1,234 likes</div>
                                                <div className="text-sm leading-relaxed">
                                                    <span className="font-semibold mr-2">your_username</span>
                                                    {caption ? (
                                                        <span className="whitespace-pre-wrap">{caption}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Write a caption...</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400 uppercase pt-1">
                                                    {scheduledAt ? format(new Date(scheduledAt), 'MMMM d') : 'Just now'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Media Selection Dialog */}
            <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Select Media</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 pt-2">
                        <MediaGrid
                            media={mediaData?.data?.media}
                            onSelect={(item) => {
                                setSelectedMedia(item);
                                setIsMediaModalOpen(false);
                            }}
                            selectedMedia={selectedMedia?.id === mediaData?.id} // Rough check, ideal is by ID
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CreatePost;
