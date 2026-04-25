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
    Share2,
    ChevronLeft,
    ChevronRight
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
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { useGetGroupsQuery } from "../features/accountGroups/accountGroupsApi";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Filter } from "lucide-react";

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
    const scrollRef = React.useRef(null);
    const { data: user } = useGetCurrentUserQuery();

    const [selectedGroup, setSelectedGroup] = React.useState(() => {
        return localStorage.getItem("lastSelectedDashboardGroup") || "all";
    });

    const { data: groupsData } = useGetGroupsQuery();

    React.useEffect(() => {
        localStorage.setItem("lastSelectedDashboardGroup", selectedGroup);
    }, [selectedGroup]);

    const { data: postsData, isLoading: postsLoading } = useGetScheduledPostsQuery({ 
        limit: 5, 
        sort: '-scheduledAt',
        groupId: selectedGroup !== "all" ? selectedGroup : undefined
    });
    
    const { data: accountsData, isLoading: accountsLoading } = useGetConnectedAccountsQuery();
    
    const { data: statsData, isLoading: statsLoading, isFetching: statsFetching } = useGetDashboardStatsQuery({
        groupId: selectedGroup !== "all" ? selectedGroup : undefined
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
                    {/* Group Filter Selector - Refined Premium Design */}
                    <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 group/select">
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger className="w-[180px] h-8 border-none bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 focus:ring-0 transition-colors group-hover/select:text-primary">
                                <div className="flex items-center">
                                    <Filter className="h-3.5 w-3.5 mr-2.5 text-primary/60 group-hover/select:text-primary transition-colors" />
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
                    iconBgColor="bg-blue-100 dark:bg-blue-900/20"
                    iconColor="text-blue-600 dark:text-blue-400"
                    gradientFrom="from-white dark:from-gray-900"
                    gradientTo="to-blue-50 dark:to-blue-900/10"
                    borderColor="border-blue-100 dark:border-blue-900/50"
                    textColor="text-gray-600 dark:text-gray-400"
                    valueColor="text-gray-900 dark:text-gray-100"
                />
                <StatCard
                    title="Connected Accounts"
                    value={connectedAccounts}
                    icon={Share2}
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
                <Card className="col-span-4 border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Performance Overview
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-gray-400">7-Day Analysis</Badge>
                        </div>
                        <CardDescription>
                            Your posting activity trends and platform distribution.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-6 space-y-12">
                        {/* Trend Chart */}
                        <div className="flex flex-col pt-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Volume Activity</h4>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-100 dark:border-gray-800 p-3 rounded-xl shadow-xl">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{payload[0].payload.date}</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                                                <p className="text-sm font-bold">{payload[0].value} Posts</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorTotal)"
                                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Platform performance chart */}
                        <div className="flex flex-col border-t border-gray-100 dark:border-gray-800 pt-10">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Platform Performance</h4>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e1306c" stopOpacity={0.1}/><stop offset="95%" stopColor="#e1306c" stopOpacity={0}/></linearGradient>
                                            <linearGradient id="colorFacebook" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1877f2" stopOpacity={0.1}/><stop offset="95%" stopColor="#1877f2" stopOpacity={0}/></linearGradient>
                                            <linearGradient id="colorLinkedin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0a66c2" stopOpacity={0.1}/><stop offset="95%" stopColor="#0a66c2" stopOpacity={0}/></linearGradient>
                                            <linearGradient id="colorYoutube" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff0000" stopOpacity={0.1}/><stop offset="95%" stopColor="#ff0000" stopOpacity={0}/></linearGradient>
                                            <linearGradient id="colorX" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#000000" stopOpacity={0.1}/><stop offset="95%" stopColor="#000000" stopOpacity={0}/></linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const date = payload[0].payload.date;
                                                    const platformsList = [
                                                        { name: 'Instagram', key: 'instagram', color: '#e1306c' },
                                                        { name: 'Facebook', key: 'facebook', color: '#1877f2' },
                                                        { name: 'LinkedIn', key: 'linkedin', color: '#0a66c2' },
                                                        { name: 'YouTube', key: 'youtube', color: '#ff0000' },
                                                        { name: 'X', key: 'x', color: '#000000' }
                                                    ];
                                                    
                                                    return (
                                                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-100 dark:border-gray-800 p-3 rounded-xl shadow-xl min-w-[150px]">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">{date}</p>
                                                            <div className="space-y-2">
                                                                {platformsList.map(p => (
                                                                    <div key={p.key} className="flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                                            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">{p.name}</span>
                                                                        </div>
                                                                        <span className="text-xs font-black">{payload[0].payload[p.key] || 0}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        {[
                                            { key: 'instagram', color: '#e1306c', grad: 'colorInstagram' },
                                            { key: 'facebook', color: '#1877f2', grad: 'colorFacebook' },
                                            { key: 'linkedin', color: '#0a66c2', grad: 'colorLinkedin' },
                                            { key: 'youtube', color: '#ff0000', grad: 'colorYoutube' },
                                            { key: 'x', color: '#000000', grad: 'colorX' }
                                        ].map(p => (
                                            <Area
                                                key={p.key}
                                                type="monotone"
                                                dataKey={p.key}
                                                stroke={p.color}
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill={`url(#${p.grad})`}
                                                dot={false}
                                                activeDot={{ r: 4, strokeWidth: 0 }}
                                                stackId="1"
                                            />
                                        ))}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
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
