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
    ChevronDown,
    X
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import GroupFilter from "../components/common/GroupFilter";
import PlatformIcon from "../components/common/PlatformIcon";
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
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Scheduler</h1>
                    <p className="text-xs md:text-sm text-muted-foreground">Manage all your scheduled and published content</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard/scheduler/bulk')}
                        className="hidden md:flex h-9 md:h-10 border-gray-200 dark:border-gray-800 rounded-xl"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Upload
                    </Button>
                    <Button onClick={() => navigate('/dashboard/create')} className="flex-1 sm:flex-none h-9 md:h-10 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold text-xs md:text-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Post
                    </Button>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-3 md:gap-4 xl:items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 md:items-center flex-1">
                    {/* Search Bar */}
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search captions..."
                            className="pl-9 h-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-xl focus-visible:ring-primary/20 transition-all text-xs md:text-sm"
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

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Group/Account Filter */}
                        <GroupFilter
                            selectedGroup={selectedGroup}
                            setSelectedGroup={setSelectedGroup}
                            containerClassName="h-7 w-[130px] md:w-[150px]"
                        />

                        {/* Platform Selector */}
                        <div className="flex items-center gap-1 bg-white dark:bg-gray-950 p-1 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                            <TooltipProvider>
                                <div className="flex items-center shrink-0">
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
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 md:mt-0">
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
            </div>


            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center justify-between mb-6 overflow-x-auto no-scrollbar">
                    <TabsList className="bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl h-11 md:h-12 w-fit shrink-0">
                        <TabsTrigger value="all" className="rounded-lg px-4 md:px-6 h-9 md:h-10 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-xs md:text-sm">All Posts</TabsTrigger>
                        <TabsTrigger value="scheduled" className="rounded-lg px-4 md:px-6 h-9 md:h-10 data-[state=active]:bg-white data-[state=active]:text-yellow-600 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">Scheduled</TabsTrigger>
                        <TabsTrigger value="posted" className="rounded-lg px-4 md:px-6 h-9 md:h-10 data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">Published</TabsTrigger>
                        <TabsTrigger value="failed" className="rounded-lg px-4 md:px-6 h-9 md:h-10 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-xs md:text-sm">Failed</TabsTrigger>
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
