import React, { useState } from "react";
import {
    useGetScheduledPostsQuery,
    useDeleteScheduledPostMutation,
    useUpdatePostStatusMutation,
} from "../features/posts/postsApi";
import { parseISO, format } from "date-fns";
import { Calendar, Calendar as CalendarIcon, LayoutList, Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";



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

    const { data: postsData, isLoading, isFetching } = useGetScheduledPostsQuery({
        page,
        limit,
        status: statusParam,
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
        <div className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto" >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Scheduler</h1>
                    <p className="text-muted-foreground mt-1">Manage all your scheduled and published content</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center">
                        <Button
                            variant={viewMode === 'list' ? 'white' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 ${viewMode === 'list' ? 'bg-white shadow-sm dark:bg-gray-700' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <LayoutList className="h-4 w-4 mr-2" />
                            List
                        </Button>
                        <Button
                            variant={viewMode === 'calendar' ? 'white' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 ${viewMode === 'calendar' ? 'bg-white shadow-sm dark:bg-gray-700' : ''}`}
                            onClick={() => setViewMode('calendar')}
                        >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Calendar
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard/scheduler/bulk')}
                            className="hidden sm:flex"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Bulk Upload
                        </Button>
                        <Button onClick={() => navigate('/dashboard/create')} className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Post
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl h-12">
                        <TabsTrigger value="all" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">All Posts</TabsTrigger>
                        <TabsTrigger value="pending" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:text-yellow-600 data-[state=active]:shadow-sm transition-all">Scheduled</TabsTrigger>
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
