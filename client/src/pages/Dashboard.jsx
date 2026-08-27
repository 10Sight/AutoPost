import React from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
    useGetScheduledPostsQuery,
    useGetDashboardStatsQuery
} from "../features/posts/postsApi";
import { useGetConnectedAccountsQuery } from "../features/socialAccounts/socialAccountsApi";
import { useGetCurrentUserQuery } from "../features/auth/authApi";
import {
    Users,
    Clock,
    CheckCircle2,
    Plus,
    Calendar,
    Settings,
    TrendingUp,
    Share2,
    Image,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import { Button } from "../components/ui/button";
import StatCard from "../components/common/StatCard";
import UsageStats from "../components/usage/UsageStats";
import YouTubeQuotaMeter from "../components/usage/YouTubeQuotaMeter";
import YouTubeChannelCard from "../components/usage/YouTubeChannelCard";
import PerformanceOverview from "../components/dashboard/PerformanceOverview";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickActionCard from "../components/dashboard/QuickActionCard";

import { useGetGroupsQuery } from "../features/accountGroups/accountGroupsApi";
import GroupFilter from "../components/common/GroupFilter";

const Dashboard = () => {
    const scrollRef = React.useRef(null);
    const { data: user } = useGetCurrentUserQuery();

    const [selectedGroup, setSelectedGroup] = React.useState(() => {
        return localStorage.getItem("lastSelectedDashboardGroup") || "all";
    });
    const [selectedDays, setSelectedDays] = React.useState("7");

    const { data: groupsData } = useGetGroupsQuery();

    React.useEffect(() => {
        localStorage.setItem("lastSelectedDashboardGroup", selectedGroup);
    }, [selectedGroup]);

    const { data: postsData, isLoading: postsLoading } = useGetScheduledPostsQuery({
        limit: 5,
        sort: '-updatedAt',
        groupId: selectedGroup !== "all" ? selectedGroup : undefined
    });
    
    const { data: accountsData, isLoading: accountsLoading } = useGetConnectedAccountsQuery();
    
    const { data: statsData, isLoading: statsLoading, isFetching: statsFetching } = useGetDashboardStatsQuery({
        groupId: selectedGroup !== "all" ? selectedGroup : undefined,
        days: parseInt(selectedDays),
    });

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    const stats = statsData?.data?.stats || { total: 0, pending: 0, posted: 0, failed: 0 };
    const chartData = statsData?.data?.chartData || [];
    const platformStats = statsData?.data?.platformStats || [];
    
    // Resolve which accounts belong to the current filter
    const currentGroup = groupsData?.data?.find(g => g._id === selectedGroup);
    
    // memoize the account ID extraction to handle both populated objects and raw IDs
    const groupAccountIds = React.useMemo(() => {
        if (!currentGroup?.accounts) return [];
        return currentGroup.accounts.map(acc => (typeof acc === "object" ? acc._id : acc));
    }, [currentGroup]);

    const filteredAccounts = React.useMemo(() => {
        const allAccounts = accountsData?.data || [];
        if (selectedGroup === "all") return allAccounts;
        
        // Use a Set for O(1) lookups if the group has many accounts for production-level performance
        const idSet = new Set(groupAccountIds);
        return allAccounts.filter(acc => idSet.has(acc._id));
    }, [selectedGroup, accountsData, groupAccountIds]);

    const connectedAccounts = filteredAccounts.length;

    // Calculate reach for filtered accounts
    const totalReach = filteredAccounts.reduce((acc, account) => {
        const platformStats = account.metadata?.statistics || {};
        const platform = account.platform?.toLowerCase();

        if (platform === "youtube") return acc + parseInt(platformStats.subscriberCount || 0);
        if (platform === "x") return acc + (platformStats.followers_count || 0);
        if (platform === "linkedin") return acc + (platformStats.followerCount || 0);
        if (platform === "instagram") return acc + (platformStats.follower_count || 0);
        if (platform === "facebook") return acc + (platformStats.follower_count || 0);
        return acc;
    }, 0) || 0;

    // Soonest upcoming post among the ones already fetched, used to back the
    // "Scheduled" stat card's trend badge with a real countdown (never fabricated).
    const scheduledTrend = React.useMemo(() => {
        const posts = postsData?.data?.posts || [];
        const upcomingStatuses = ["scheduled", "pending_approval", "approved", "processing"];
        const now = Date.now();

        const nextPost = posts
            .filter((p) => upcomingStatuses.includes(p.status) && new Date(p.scheduledAt).getTime() > now)
            .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];

        if (!nextPost) return null;

        const diffMs = new Date(nextPost.scheduledAt).getTime() - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        let label;
        if (diffHours < 1) label = `Next in ${Math.max(1, Math.round(diffMs / 60000))}m`;
        else if (diffHours < 24) label = `Next in ${Math.round(diffHours)}h`;
        else label = `Next in ${Math.round(diffHours / 24)}d`;

        return { label, direction: "neutral" };
    }, [postsData]);

    // Success rate derived from real posted/failed counts (org-wide, not just the
    // fetched page), omitted entirely when there's no attempt history yet.
    const publishedTrend = React.useMemo(() => {
        const attempts = stats.posted + stats.failed;
        if (attempts === 0) return null;
        const rate = (stats.posted / attempts) * 100;
        return {
            label: `${rate.toFixed(1)}% Success`,
            direction: rate >= 90 ? "up" : rate >= 70 ? "neutral" : "down",
        };
    }, [stats.posted, stats.failed]);

    // Badges are only ever real numbers already in scope — never fabricated.
    const quickActions = [
        {
            href: "/dashboard/create",
            title: "Create Post",
            description: "Draft and schedule new content",
            icon: Plus,
            accent: "text-blue-600 dark:text-blue-400",
        },
        {
            href: "/dashboard/settings",
            title: "Connect Accounts",
            description: "Manage social profiles",
            icon: Users,
            accent: "text-purple-600 dark:text-purple-400",
            badge: accountsLoading ? null : `${connectedAccounts} connected`,
        },
        {
            href: "/dashboard/scheduler",
            title: "View Schedule",
            description: "Check upcoming posts",
            icon: Calendar,
            accent: "text-orange-600 dark:text-orange-400",
            badge: statsLoading ? null : `${stats.pending} upcoming`,
        },
        {
            href: "/dashboard/media",
            title: "Media Library",
            description: "Upload and organize assets",
            icon: Image,
            accent: "text-pink-600 dark:text-pink-400",
        },
        {
            href: "/dashboard/analytics",
            title: "Analytics",
            description: "View performance insights",
            icon: TrendingUp,
            accent: "text-green-600 dark:text-green-400",
        },
    ];

    return (
        <div className={`flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-[1600px] mx-auto transition-opacity duration-300 ${statsFetching ? 'opacity-70' : 'opacity-100'}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Dashboard
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        Welcome back, <span className="font-semibold text-gray-900 dark:text-gray-100">{user?.data?.name?.split(" ")[0] || "User"}</span>
                        <span className="text-gray-300 dark:text-gray-700 mx-1">|</span>
                        <span>{format(new Date(), "EEEE, MMMM do, yyyy")}</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <GroupFilter selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />

                    <Button asChild className="h-10 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">
                        <Link to="/dashboard/create">
                            <Plus className="mr-2 h-4 w-4" /> Create Post
                        </Link>
                    </Button>
                </div>
            </div>
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Audience"
                    value={totalReach}
                    icon={Users}
                    description="Reach across platforms"
                    loading={accountsLoading}
                    iconColor="text-blue-600 dark:text-blue-400"
                />
                <StatCard
                    title="Connected Accounts"
                    value={connectedAccounts}
                    icon={Share2}
                    description="Active profiles"
                    loading={accountsLoading}
                    iconColor="text-purple-600 dark:text-purple-400"
                />
                <StatCard
                    title="Scheduled"
                    value={stats.pending}
                    icon={Clock}
                    description="Upcoming posts"
                    loading={statsLoading}
                    iconColor="text-orange-600 dark:text-orange-400"
                    trend={scheduledTrend}
                />
                <StatCard
                    title="Published"
                    value={stats.posted}
                    icon={CheckCircle2}
                    description="Successfully sent"
                    loading={statsLoading}
                    iconColor="text-green-600 dark:text-green-400"
                    trend={publishedTrend}
                />
            </div>



            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart Section */}
                <PerformanceOverview
                    chartData={chartData}
                    platformStats={platformStats}
                    selectedDays={selectedDays}
                    onSelectedDaysChange={setSelectedDays}
                    isLoading={statsLoading}
                    isFetching={statsFetching}
                />

                {/* Usage Stats Section */}
                <div className="col-span-3 space-y-4">
                    {accountsData?.data?.filter(acc => acc.platform === "youtube").map(acc => (
                        <YouTubeChannelCard key={acc._id} account={acc} />
                    ))}
                    <UsageStats />
                    <YouTubeQuotaMeter />
                </div>
            </div>

            {/* Recent Activity Row */}
            <div className="grid gap-4 grid-cols-1">
                <RecentActivity posts={postsData?.data?.posts || []} isLoading={postsLoading} />
            </div>

            {/* Quick Actions Grid */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 px-1">Quick Actions</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {quickActions.map((action) => (
                    <QuickActionCard key={action.href} {...action} />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
