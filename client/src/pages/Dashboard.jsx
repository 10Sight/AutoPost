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
    Activity,
    Users,
    Clock,
    CheckCircle2,
    Instagram,
    Facebook,
    Linkedin,
    Twitter,
    Plus,
    Calendar,
    Settings,
    ArrowUpRight,
    TrendingUp,
    BarChart3,
    Sparkles,
    MessageSquare,
    Share2
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import StatCard from "../components/common/StatCard";
import UsageStats from "../components/usage/UsageStats";
import YouTubeQuotaMeter from "../components/usage/YouTubeQuotaMeter";
import YouTubeChannelCard from "../components/usage/YouTubeChannelCard";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const PlatformIcon = ({ platform }) => {
    switch (platform?.toLowerCase()) {
        case "instagram": return <Instagram className="h-4 w-4 text-pink-600" />;
        case "facebook": return <Facebook className="h-4 w-4 text-blue-600" />;
        case "linkedin": return <Linkedin className="h-4 w-4 text-blue-700" />;
        case "twitter": case "x": return <Twitter className="h-4 w-4 text-black dark:text-white" />;
        default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
};

const Dashboard = () => {
    const { data: user } = useGetCurrentUserQuery();
    const { data: postsData, isLoading: postsLoading } = useGetScheduledPostsQuery(
        { limit: 5, sort: '-scheduledAt' }
    );
    const { data: accountsData, isLoading: accountsLoading } =
        useGetConnectedAccountsQuery();
    const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();

    const stats = statsData?.data?.stats || { total: 0, pending: 0, posted: 0, failed: 0 };
    const chartData = statsData?.data?.chartData || [];
    const connectedAccounts = accountsData?.data?.length || 0;

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-[1600px] mx-auto">
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
                <div className="flex items-center gap-2">
                    <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                        <Link to="/dashboard/create">
                            <Plus className="mr-2 h-4 w-4" /> Create New Post
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Posts"
                    value={stats.total}
                    icon={Activity}
                    description="All time posts"
                    loading={statsLoading}
                />
                <StatCard
                    title="Connected Accounts"
                    value={connectedAccounts}
                    icon={Users}
                    description="Active profiles"
                    loading={accountsLoading}
                    iconBgColor="bg-purple-100 dark:bg-purple-900/20"
                    iconColor="text-purple-600 dark:text-purple-400"
                    gradientFrom="from-white dark:from-gray-900"
                    gradientTo="to-purple-50 dark:to-purple-900/10"
                    borderColor="border-purple-100 dark:border-purple-900/50"
                    textColor="text-gray-600 dark:text-gray-400"
                    valueColor="text-gray-900 dark:text-gray-100"
                />
                <StatCard
                    title="Scheduled"
                    value={stats.pending}
                    icon={Clock}
                    description="Upcoming posts"
                    loading={statsLoading}
                    iconBgColor="bg-orange-100 dark:bg-orange-900/20"
                    iconColor="text-orange-600 dark:text-orange-400"
                    gradientFrom="from-white dark:from-gray-900"
                    gradientTo="to-orange-50 dark:to-orange-900/10"
                    borderColor="border-orange-100 dark:border-orange-900/50"
                    textColor="text-gray-600 dark:text-gray-400"
                    valueColor="text-gray-900 dark:text-gray-100"
                />
                <StatCard
                    title="Published"
                    value={stats.posted}
                    icon={CheckCircle2}
                    description="Successfully sent"
                    loading={statsLoading}
                    iconBgColor="bg-green-100 dark:bg-green-900/20"
                    iconColor="text-green-600 dark:text-green-400"
                    gradientFrom="from-white dark:from-gray-900"
                    gradientTo="to-green-50 dark:to-green-900/10"
                    borderColor="border-green-100 dark:border-green-900/50"
                    textColor="text-gray-600 dark:text-gray-400"
                    valueColor="text-gray-900 dark:text-gray-100"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart Section */}
                <Card className="col-span-4 border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Performance Overview
                        </CardTitle>
                        <CardDescription>
                            Your posting activity trends over the last 7 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '5 5' }}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="stroke-gray-100 dark:stroke-gray-800" />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

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
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>
                            Status updates on your latest scheduled posts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        <ScrollArea className="h-[350px] pr-4 -mr-4">
                            <div className="space-y-4 pr-4">
                                {postsLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-2 py-8">
                                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                                        <p className="text-sm text-muted-foreground">Loading activity...</p>
                                    </div>
                                ) : postsData?.data?.posts?.length > 0 ? (
                                    postsData.data.posts.map((post) => (
                                        <div key={post._id} className="group flex flex-col gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 ring-2 ring-gray-100 dark:ring-gray-800">
                                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${post.platforms?.[0] || 'P'}&background=random`} />
                                                        <AvatarFallback>{post.platforms?.[0]?.[0] || 'P'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                                                {post.platforms?.[0] || "Social"}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">•</span>
                                                            <span className="text-[10px] text-gray-500">
                                                                {format(new Date(post.scheduledAt), "MMM d, h:mm a")}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mt-0.5 font-medium">
                                                            {post.caption || "Untitled Post"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {post.status === "posted" && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50"><CheckCircle2 className="w-3 h-3 mr-1" /> Posted</Badge>}
                                                    {post.status === "pending" && <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>}
                                                    {post.status === "failed" && <Badge variant="destructive" className="h-5 text-[10px]">Failed</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                            <Calendar className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No recent activity</h3>
                                        <p className="text-xs text-gray-500 mt-1 mb-4 max-w-[200px]">
                                            Scheduled posts will appear here.
                                        </p>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link to="/dashboard/create">Schedule a Post</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions Grid */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 px-1">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link to="/dashboard/create" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">Create Post</CardTitle>
                            <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 group-hover:scale-110 transition-transform">
                                <Plus className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-gray-500">Draft and schedule new content</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/dashboard/settings" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 transition-colors">Connect Accounts</CardTitle>
                            <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-500 group-hover:scale-110 transition-transform">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-gray-500">Manage social profiles</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/dashboard/scheduler" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-orange-600 transition-colors">View Schedule</CardTitle>
                            <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 group-hover:scale-110 transition-transform">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-gray-500">Check upcoming posts</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/dashboard/analytics" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 transition-colors">Analytics</CardTitle>
                            <div className="p-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-gray-500">View performance insights</div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
