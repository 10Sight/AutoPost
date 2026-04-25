import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetScheduledPostsQuery, useGetAccountStatsQuery } from "../features/posts/postsApi";
import { useGetConnectedAccountsQuery } from "../features/socialAccounts/socialAccountsApi";
import PostCard from "../components/post/PostCard";
import { 
    Loader2, 
    ChevronLeft, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Users,
    Activity,
    Target
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { subDays } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import StatCard from "../components/common/StatCard";

const AccountInsights = () => {
    const { accountId } = useParams();
    const navigate = useNavigate();
    
    // Filters State
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState("30"); // days

    // Calculate dates based on range
    const { startDate, endDate } = useMemo(() => {
        if (statusFilter === 'all' || statusFilter === 'scheduled') {
            return { startDate: undefined, endDate: undefined };
        }
        const end = new Date();
        const start = subDays(end, parseInt(dateRange));
        return {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        };
    }, [dateRange, statusFilter]);

    // Data Fetching
    const { data: accountsData, isLoading: isLoadingAccount } = useGetConnectedAccountsQuery();
    const { data: statsData, isLoading: isLoadingStats } = useGetAccountStatsQuery(accountId, {
        skip: !accountId || accountId === "undefined"
    });
    const { data: postsData, isLoading: isLoadingPosts, isFetching: isFetchingPosts } = useGetScheduledPostsQuery({
        socialAccountId: accountId,
        status: statusFilter === "all" ? undefined : statusFilter,
        startDate,
        endDate,
        limit: 50
    });

    // Find current account
    const account = useMemo(() => {
        return accountsData?.data?.find(a => a._id === accountId);
    }, [accountsData, accountId]);

    if (isLoadingAccount && !account) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground mt-4">Loading account details...</p>
            </div>
        );
    }

    if (!account && !isLoadingAccount) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold">Account not found</h2>
                <Button variant="link" onClick={() => navigate("/dashboard/analytics")}>Return to Analytics</Button>
            </div>
        );
    }

    const metadataStats = account?.metadata?.statistics || {};
    const followerCount = metadataStats.follower_count || metadataStats.followerCount || metadataStats.followersCount || metadataStats.subscriberCount || 0;
    const realStats = statsData?.data || { total: 0, scheduled: 0, published: 0, failed: 0 };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {/* Classic Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full h-10 w-10 hover:bg-gray-50 dark:hover:bg-gray-900"
                        onClick={() => navigate("/dashboard/analytics")}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 ring-2 ring-gray-100 dark:ring-gray-800 shadow-sm">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(account.platformUserName || account.channelTitle || 'User')}&background=random`} />
                            <AvatarFallback>{(account.platformUserName || account.channelTitle || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <Badge variant="secondary" className="capitalize text-[10px] font-bold px-2 py-0 bg-gray-100 dark:bg-gray-800 text-gray-500 border-none">
                                    {account.platform} Channel
                                </Badge>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                {account.platformUserName || account.channelTitle || "Account Insights"}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-lg border border-gray-100 dark:border-gray-800">
                    {["7", "14", "30", "90"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                dateRange === range 
                                ? "bg-white dark:bg-gray-800 text-primary shadow-sm" 
                                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                            }`}
                        >
                            {range}D
                        </button>
                    ))}
                </div>
            </div>

            {/* Classic Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Audience"
                    value={parseInt(followerCount || 0)}
                    icon={Users}
                    description="Channel followers/subscribers"
                    iconBgColor="bg-blue-100 dark:bg-blue-900/20"
                    iconColor="text-blue-600 dark:text-blue-400"
                    borderColor="border-gray-200 dark:border-gray-800"
                />
                <StatCard
                    title="Posts Published"
                    value={realStats.published}
                    icon={CheckCircle2}
                    description="Success rate lifetime"
                    iconBgColor="bg-green-100 dark:bg-green-900/20"
                    iconColor="text-green-600 dark:text-green-400"
                    borderColor="border-gray-200 dark:border-gray-800"
                />
                <StatCard
                    title="Global Activity"
                    value={realStats.total}
                    icon={Activity}
                    description="Total content tracked"
                    iconBgColor="bg-orange-100 dark:bg-orange-900/20"
                    iconColor="text-orange-600 dark:text-orange-400"
                    borderColor="border-gray-200 dark:border-gray-800"
                />
            </div>

            {/* Minimalist Content Tabs */}
            <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 border-b border-gray-100 dark:border-gray-800">
                    <TabsList className="bg-transparent h-auto p-0 gap-8 rounded-none w-full md:w-auto overflow-x-auto no-scrollbar">
                        <TabsTrigger 
                            value="all" 
                            className="relative group px-4 py-6 text-xs font-bold uppercase tracking-[0.15em] opacity-40 data-[state=active]:opacity-100 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
                        >
                            All Content
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary group-data-[state=active]:scale-x-100 scale-x-0 transition-transform duration-300 rounded-full" />
                        </TabsTrigger>
                        <TabsTrigger 
                            value="scheduled" 
                            className="relative group px-4 py-6 text-xs font-bold uppercase tracking-[0.15em] opacity-40 data-[state=active]:opacity-100 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
                        >
                            <div className="flex items-center gap-3">
                                Scheduled
                                <span className="text-[10px] font-black opacity-40 group-data-[state=active]:text-blue-500 group-data-[state=active]:opacity-100">
                                    {realStats.scheduled}
                                </span>
                            </div>
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 group-data-[state=active]:scale-x-100 scale-x-0 transition-transform duration-300 rounded-full" />
                        </TabsTrigger>
                        <TabsTrigger 
                            value="posted" 
                            className="relative group px-4 py-6 text-xs font-bold uppercase tracking-[0.15em] opacity-40 data-[state=active]:opacity-100 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
                        >
                            <div className="flex items-center gap-3">
                                Published
                                <span className="text-[10px] font-black opacity-40 group-data-[state=active]:text-green-500 group-data-[state=active]:opacity-100">
                                    {realStats.published}
                                </span>
                            </div>
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-green-500 group-data-[state=active]:scale-x-100 scale-x-0 transition-transform duration-300 rounded-full" />
                        </TabsTrigger>
                        <TabsTrigger 
                            value="failed" 
                            className="relative group px-4 py-6 text-xs font-bold uppercase tracking-[0.15em] opacity-40 data-[state=active]:opacity-100 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all"
                        >
                            <div className="flex items-center gap-3">
                                Failed
                                <span className="text-[10px] font-black opacity-40 group-data-[state=active]:text-red-500 group-data-[state=active]:opacity-100">
                                    {realStats.failed}
                                </span>
                            </div>
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-red-500 group-data-[state=active]:scale-x-100 scale-x-0 transition-transform duration-300 rounded-full" />
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="relative min-h-[400px]">
                    {(isLoadingPosts || isFetchingPosts) && (
                        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${(isLoadingPosts || isFetchingPosts) ? 'opacity-30' : 'opacity-100'}`}>
                        {postsData?.data?.posts?.length > 0 ? (
                            postsData.data.posts.map((post) => (
                                <PostCard 
                                    key={post._id} 
                                    post={post} 
                                    onDelete={() => {}} 
                                    onStatusUpdate={() => {}}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="h-16 w-16 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                                    <Clock className="h-8 w-8 text-gray-300" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">No content found</h3>
                                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                                        Adjust your filters or timeframe to see activity for this channel.
                                    </p>
                                    <Button size="sm" variant="outline" className="mt-4" onClick={() => navigate("/dashboard/create")}>
                                        Schedule Post
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Tabs>
        </div>
    );
};

export default AccountInsights;
