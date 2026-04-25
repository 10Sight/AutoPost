import React, { useState } from "react";
import {
    useGetScheduledPostsQuery,
    useDeleteScheduledPostMutation,
    useUpdatePostStatusMutation,
} from "../features/posts/postsApi";
import { parseISO, format } from "date-fns";
import {
    Calendar,
    Calendar as CalendarIcon,
    LayoutList,
    Loader2,
    Plus,
    Upload,
    Search,
    Filter,
    ChevronDown,
    X
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import { useGetGroupsQuery } from "../features/accountGroups/accountGroupsApi";
import PlatformIcon from "../components/common/PlatformIcon";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip";



import PostCard from "../components/post/PostCard";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";

import CalendarView from "../components/post/CalendarView";
const Scheduler = () => {
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState("all");
    const [viewMode, setViewMode] = useState("calendar"); // Default to calendar for better UX
    const navigate = useNavigate();

    // Limit based on view mode - fetch more for calendar
    const limit = viewMode === "calendar" ? 100 : 10;

    // Map tab value to API status param (all -> undefined)
    const statusParam = activeTab === "all" ? undefined : activeTab;

    const [selectedGroup, setSelectedGroup] = useState(() => {
        return localStorage.getItem("lastSelectedSchedulerGroup") || "all";
    });
    const [selectedPlatform, setSelectedPlatform] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const { data: groupsData } = useGetGroupsQuery();

    // Debounce search for scalability
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Persist group selection
    React.useEffect(() => {
        localStorage.setItem("lastSelectedSchedulerGroup", selectedGroup);
        setPage(1);
    }, [selectedGroup]);

    const { data: postsData, isLoading, isFetching } = useGetScheduledPostsQuery({
        page,
        limit,
        status: statusParam,
        groupId: selectedGroup !== "all" ? selectedGroup : undefined,
        platform: selectedPlatform !== "all" ? selectedPlatform : undefined,
        search: debouncedSearch || undefined,
        sort: "-scheduledAt", // Newest first
    });




    const [deletePost] = useDeleteScheduledPostMutation();
    const [updateStatus] = useUpdatePostStatusMutation();
    const user = useSelector(selectCurrentUser);
    const canApprove = ["admin", "reviewer"].includes(user?.role);
    const canSchedule = ["admin", "publisher"].includes(user?.role);

    const handleStatusUpdate = async (postId, status) => {
        try {
            await updateStatus({ postId, status }).unwrap();
            toast.success(`Post ${status} successfully`);
        } catch (error) {
            console.error(`Failed to update status to ${status}:`, error);
            toast.error(`Failed to ${status} post`);
        }
    };

    const handleDelete = async (postId) => {
        if (window.confirm("Are you sure you want to delete this scheduled post?")) {
            try {
                await deletePost(postId).unwrap();
                toast.success("Post deleted");
            } catch (error) {
                console.error("Failed to delete post:", error);
                toast.error("Failed to delete post");
            }
        }
    };

    const handleTabChange = (value) => {
        setActiveTab(value);
        setPage(1); // Reset to first page on tab change
    };

    const handleDateClick = (date) => {
        // Navigate to create post with selected date pre-filled (future feature)
        navigate(`/dashboard/create?date=${date.toISOString()}`);
    };

    const renderWebList = () => {
        if (isLoading) {
            return (
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            );
        }

        if (!postsData?.data?.posts?.length) {
            return (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in-50">
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-full mb-4">
                        <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">No posts found</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm text-center">
                        {viewMode === 'calendar'
                            ? "No posts scheduled for this period."
                            : activeTab !== "all"
                                ? `You don't have any ${activeTab} posts right now.`
                                : "You haven't scheduled any posts yet."}
                    </p>
                    <Button onClick={() => navigate('/dashboard/create')} className="mt-6">
                        Create First Post
                    </Button>
                </div>
            );
        }

        if (viewMode === "calendar") {
            return (
                <CalendarView
                    posts={postsData?.data?.posts || []}
                    onDateClick={handleDateClick}
                />
            );
        }

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {postsData.data.posts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div className="text-sm text-gray-500">
                        Showing page <span className="font-medium text-gray-900 dark:text-gray-100">{postsData.data.page}</span> of <span className="font-medium">{postsData.data.totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={!postsData.data.hasPrevPage || isFetching}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!postsData.data.hasNextPage || isFetching}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto transition-opacity duration-300" style={{ opacity: isFetching ? 0.7 : 1 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Scheduler</h1>
                    <p className="text-muted-foreground mt-1">Manage all your scheduled and published content</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard/scheduler/bulk')}
                        className="hidden sm:flex h-10 border-gray-200 dark:border-gray-800 rounded-xl"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Upload
                    </Button>
                    <Button onClick={() => navigate('/dashboard/create')} className="h-10 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Post
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 md:items-center flex-1">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search captions..."
                            className="pl-9 h-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-xl focus-visible:ring-primary/20 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {/* Group/Account Filter - Refined Premium Design */}
                    <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 group/select">
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger className="w-[150px] h-7 border-none bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 focus:ring-0 transition-colors group-hover/select:text-primary">
                                <div className="flex items-center">
                                    <Filter className="h-3 w-3 mr-2 text-primary/60 group-hover/select:text-primary transition-colors" />
                                    <SelectValue placeholder="Select Group" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                <SelectItem value="all" className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer rounded-lg mx-1">
                                    Global View
                                </SelectItem>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                                {groupsData?.data?.map((group) => (
                                    <SelectItem 
                                        key={group._id} 
                                        value={group._id} 
                                        className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer rounded-lg mx-1"
                                    >
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Platform Selector */}
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-950 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                        <TooltipProvider>
                            <div className="flex items-center">
                                <button
                                    onClick={() => { setSelectedPlatform("all"); setPage(1); }}
                                    className={`px-3 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${selectedPlatform === "all"
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        }`}
                                >
                                    All
                                </button>
                                <div className="w-[1px] h-3 bg-gray-200 dark:bg-gray-800 mx-1.5" />
                                <div className="flex items-center gap-0.5">
                                    {['facebook', 'instagram', 'linkedin', 'youtube', 'x'].map((plt) => (
                                        <Tooltip key={plt}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => { setSelectedPlatform(plt); setPage(1); }}
                                                    className={`p-1.5 rounded-lg transition-all ${selectedPlatform === plt
                                                            ? "bg-gray-100 dark:bg-gray-800 scale-110 shadow-inner"
                                                            : "grayscale opacity-30 hover:grayscale-0 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                        }`}
                                                >
                                                    <PlatformIcon platform={plt} className="h-3.5 w-3.5" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-gray-900 text-white text-[9px] font-bold uppercase py-1">
                                                {plt}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                        </TooltipProvider>
                    </div>
                </div>

                {/* View Mode Switcher Integrates Here */}
                <div className="flex items-center gap-1 bg-white dark:bg-gray-950 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                    <button
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        onClick={() => setViewMode('list')}
                    >
                        <LayoutList className="h-4 w-4" />
                    </button>
                    <button
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        onClick={() => setViewMode('calendar')}
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>


            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl h-12">
                        <TabsTrigger value="all" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">All Posts</TabsTrigger>
                        <TabsTrigger value="scheduled" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:text-yellow-600 data-[state=active]:shadow-sm transition-all">Scheduled</TabsTrigger>
                        <TabsTrigger value="posted" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm transition-all">Published</TabsTrigger>
                        <TabsTrigger value="failed" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all">Failed</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-0 focus-visible:outline-none">
                    {renderWebList()}
                </TabsContent>
            </Tabs>
        </div >
    );
};

export default Scheduler;
