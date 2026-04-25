import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { useCreateScheduledPostMutation, useUpdateScheduledPostMutation } from "../features/posts/postsApi";
import { useGetConnectedAccountsQuery, useScheduleYouTubePostMutation } from "../features/socialAccounts/socialAccountsApi";
import { useGetGroupsQuery } from "../features/accountGroups/accountGroupsApi";
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
    MoreHorizontal,
    Library,
    Folder
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
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
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
import { Wand2 } from "lucide-react";


const CreatePost = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [createPost, { isLoading: isCreating }] = useCreateScheduledPostMutation();
    const [updatePost, { isLoading: isUpdating }] = useUpdateScheduledPostMutation();
    const [scheduleYouTubePost, { isLoading: isSchedulingYouTube }] = useScheduleYouTubePostMutation();
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

    // Professional Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedMediaForEdit, setSelectedMediaForEdit] = useState(null);

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
                <DialogContent className="max-w-7xl h-[85vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl">Select Media Content</DialogTitle>
                                <DialogDescription className="text-xs mt-1">
                                    Browse your organization's creative library to find the perfect assets.
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-4">
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
                                <Separator orientation="vertical" className="h-8" />
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="h-6">
                                        {selectedMediaIds.length} Selected
                                    </Badge>
                                    {selectedMediaIds.length > 0 && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => setSelectedMediaIds([])}
                                        >
                                            Clear Selection
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 flex overflow-hidden min-h-0">
                        {/* Sidebar - Folder Navigation (Production-Level Scalable UI) */}
                        <div className="w-64 border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col shrink-0">
                            <div className="p-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Folders
                            </div>
                            <ScrollArea className="flex-1 px-3">
                                <div className="space-y-1 pb-4">
                                    {/* Default "All Media" view */}
                                    <button
                                        onClick={() => setActiveFolderId(null)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                            activeFolderId === null
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        }`}
                                    >
                                        <Library className="h-4 w-4" />
                                        <span>All Assets</span>
                                    </button>

                                    {/* Organization-specific folders */}
                                    {isLoadingFolders ? (
                                        <div className="flex justify-center p-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                        </div>
                                    ) : foldersData?.data?.length > 0 ? (
                                        foldersData.data.map((folder) => (
                                            <button
                                                key={folder._id}
                                                onClick={() => setActiveFolderId(folder._id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                                    activeFolderId === folder._id
                                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                }`}
                                            >
                                                <Folder className={`h-4 w-4 ${activeFolderId === folder._id ? "text-white" : "text-gray-400"}`} />
                                                <span className="truncate">{folder.name}</span>
                                            </button>
                                        ))
                                    ) : null}
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
        </div>
    );
};

export default CreatePost;
