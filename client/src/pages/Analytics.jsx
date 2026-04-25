import React, { useState } from "react";
import { useGetAnalyticsQuery } from "../features/posts/postsApi";
import { useGetConnectedAccountsQuery } from "../features/socialAccounts/socialAccountsApi";
import { useGetGroupsQuery } from "../features/accountGroups/accountGroupsApi";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, Share2, ArrowUpRight, Globe, Filter } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import SocialAccountStatCard from "../components/dashboard/SocialAccountStatCard";

const Analytics = () => {
    const [selectedPlatform, setSelectedPlatform] = useState("all");
    const [selectedDays, setSelectedDays] = useState("30");
    const [selectedGroupId, setSelectedGroupId] = useState(() => {
        return localStorage.getItem("lastSelectedAnalyticsGroup") || "all";
    });

    const {
        data: analyticsData,
        isLoading: analyticsLoading,
        isFetching: analyticsFetching
    } = useGetAnalyticsQuery({
        days: parseInt(selectedDays),
        groupId: selectedGroupId !== "all" ? selectedGroupId : undefined
    });

    const { data: accountsData, isLoading: accountsLoading } = useGetConnectedAccountsQuery();
    const { data: groupsData } = useGetGroupsQuery();

    const isLoading = analyticsLoading || accountsLoading;
    const isUpdating = analyticsFetching && !analyticsLoading;

    // Filter accounts based on group for frontend calculations
    const filteredAccounts = React.useMemo(() => {
        if (!accountsData?.data) return [];
        if (selectedGroupId === "all") return accountsData.data;

        const group = groupsData?.data?.find(g => g._id === selectedGroupId);
        if (!group) return accountsData.data;

        // Populate accounts are returned in groups
        return group.accounts || [];
    }, [accountsData, groupsData, selectedGroupId]);

    // Update persistence
    React.useEffect(() => {
        localStorage.setItem("lastSelectedAnalyticsGroup", selectedGroupId);
    }, [selectedGroupId]);

    // Safely access data
    const platformData = analyticsData?.data?.platformDistribution || [];
    const statusData = analyticsData?.data?.statusDistribution || [];
    const volumeData = analyticsData?.data?.volumeData || [];

    // Colors for charts
    const PLATFORM_COLORS = {
        instagram: "#E1306C",
        facebook: "#4267B2",
        linkedin: "#0077b5",
        youtube: "#ff0000",
        x: "#000000",
        Instagram: "#E1306C",
        Facebook: "#4267B2",
        LinkedIn: "#0077b5",
        Twitter: "#1DA1F2",
        X: "#000000",
    };

    const STATUS_COLORS = {
        posted: "#22c55e", // green-500
        pending: "#eab308", // yellow-500
        failed: "#ef4444", // red-500
    };

    // Correct Data Calculations
    const processedStatusData = React.useMemo(() => {
        if (!statusData || statusData.length === 0) return [];

        // Aggregate by status name (Global view for health check)
        const aggregated = statusData.reduce((acc, curr) => {
            const existing = acc.find(item => item.name === curr.status);
            if (existing) {
                existing.value += curr.value;
            } else {
                acc.push({ name: curr.status, value: curr.value });
            }
            return acc;
        }, []);

        return aggregated;
    }, [statusData]);

    const totalAudience = filteredAccounts.reduce((acc, account) => {
        const stats = account.metadata?.statistics || {};
        const count = stats.follower_count || stats.followerCount || stats.followersCount || stats.followers_count || parseInt(stats.subscriberCount || 0) || 0;
        return acc + count;
    }, 0) || 0;

    const totalScheduledPosts = statusData?.reduce((acc, curr) => acc + curr.value, 0) || 0;
    const activePlatformsCount = filteredAccounts.length || 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground mt-4">Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Analytics Center
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-muted-foreground">Real-time performance metrics</p>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <SelectTrigger className="w-[180px] h-7 text-[10px] font-bold uppercase tracking-wider bg-transparent border-primary/20 hover:border-primary/50 transition-all rounded-full px-4">
                                <SelectValue placeholder="All Groups" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 shadow-2xl">
                                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">All Accounts</SelectItem>
                                {groupsData?.data?.map((group) => (
                                    <SelectItem key={group._id} value={group._id} className="text-[10px] font-bold uppercase tracking-widest">
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 px-2 py-0.5 font-semibold text-[10px]">
                        Live Data
                    </Badge>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Last synced: Just Now</span>
                </div>
            </div>

            {/* Hero Global Stat Card */}
            <Card className="relative overflow-hidden border-none shadow-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white mb-10">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 -skew-x-12 translate-x-1/4" />

                <CardContent className="p-8 md:p-10 relative z-10">
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
                                <TrendingUp className="h-3.5 w-3.5 text-blue-100" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-50/90">Global Performance Summary</span>
                            </div>
                            <div className="space-y-1 min-h-[80px] flex flex-col justify-center">
                                {isUpdating ? (
                                    <div className="h-16 w-48 bg-white/20 animate-pulse rounded-lg" />
                                ) : (
                                    <>
                                        <h3 className="text-5xl md:text-6xl font-bold tracking-tight flex items-baseline gap-3">
                                            {totalAudience.toLocaleString()}
                                            <span className="text-lg font-medium text-blue-100 opacity-80">Followers</span>
                                        </h3>
                                        <p className="text-lg text-blue-100/80 font-medium">
                                            Across <span className="text-white font-bold underline decoration-blue-400 decoration-2 underline-offset-4 pointer-events-none">{activePlatformsCount} platforms</span> with <span className="text-white font-bold underline decoration-green-400 decoration-2 underline-offset-4 pointer-events-none">{totalScheduledPosts} total posts</span> tracked.
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3 pt-4">
                                <Button className="bg-white text-indigo-700 hover:bg-white/90 font-bold rounded-xl px-6 py-5 shadow-lg group/btn">
                                    Generate Report
                                    <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                </Button>
                                <Button variant="outline" className="border-white/40 text-white hover:bg-white hover:text-indigo-700 font-semibold rounded-xl px-6 py-5 bg-white/10 transition-all">
                                    Compare
                                </Button>
                            </div>
                        </div>

                        <div className="hidden md:block bg-white/5 rounded-2xl p-5 border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold uppercase tracking-widest text-[9px] opacity-70">Engagement Velocity</h4>
                                <Badge variant="secondary" className="bg-white/10 text-white border-none text-[8px] font-bold">7D Window</Badge>
                            </div>
                            <ResponsiveContainer width="100%" height={140}>
                                <AreaChart data={volumeData.slice(-7)}>
                                    <Area
                                        type="monotone"
                                        dataKey="posts"
                                        stroke="#fff"
                                        strokeWidth={2.5}
                                        fillOpacity={0.1}
                                        fill="#fff"
                                        activeDot={{ r: 4, fill: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Platform Performance Section Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Channel Performance
                    </h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {accountsLoading || isUpdating ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-[200px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                        ))
                    ) : filteredAccounts.length > 0 ? (
                        filteredAccounts.map((account) => (
                            <SocialAccountStatCard key={account._id} account={account} />
                        ))
                    ) : (
                        <Card className="col-span-full border-dashed border-2 bg-gray-50/50 dark:bg-gray-900/20 py-12">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <Share2 className="h-12 w-12 text-gray-300 mb-4" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No data to display</h4>
                                <p className="text-sm text-gray-500 max-w-[300px] mt-2">Connect social accounts to see detailed channel-level performance.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7 mt-12">
                {/* Platform Distribution */}
                <Card className="col-span-3 border-none bg-white/95 dark:bg-gray-950/95 shadow-xl shadow-black/5">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <PieChartIcon className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase font-black opacity-50">Volume Share</Badge>
                        </div>
                        <CardTitle className="text-lg font-bold">Platform Distribution</CardTitle>
                        <CardDescription className="text-xs">Where your content is being scheduled.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full">
                            {platformData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={platformData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {platformData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={PLATFORM_COLORS[entry.name] || "#8884d8"}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-gray-900 dark:bg-white px-4 py-2 rounded-xl border-none shadow-2xl text-white dark:text-black">
                                                            <p className="text-[10px] uppercase font-black tracking-widest opacity-70 mb-1">{payload[0].name}</p>
                                                            <p className="text-lg font-black">{payload[0].value}% Weight</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[320px] items-center justify-center text-muted-foreground italic font-medium">
                                    Aggregation in progress...
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Status Breakdown */}
                <Card className="col-span-4 border-none bg-white/95 dark:bg-gray-950/95 shadow-xl shadow-black/5">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <Activity className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase font-black opacity-50">Health Check</Badge>
                        </div>
                        <CardTitle className="text-lg font-bold">Engagement Status</CardTitle>
                        <CardDescription className="text-xs">Success vs. Pending vs. Failed posts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full">
                            {processedStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart
                                        data={processedStatusData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={80}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', fill: 'currentColor', opacity: 0.6 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white dark:bg-black px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-2xl">
                                                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">{payload[0].name}</p>
                                                            <p className="text-lg font-black text-primary">{payload[0].value} Posts</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                                            {processedStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#8884d8"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[320px] items-center justify-center text-muted-foreground italic font-medium">
                                    Awaiting telemetry...
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Publishing Volume Trends */}
                <Card className="col-span-7 border-none bg-white dark:bg-gray-950 shadow-2xl shadow-black/5 mt-4">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl font-bold">Publishing Volume Trends</CardTitle>
                                        <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[9px] font-black uppercase tracking-tighter bg-primary/10 text-primary border-none">
                                            {selectedDays}D Active
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        {analyticsFetching ? "Recalculating frequency..." : `Analysis of posting frequency across the last ${selectedDays} days.`}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Select value={selectedDays} onValueChange={setSelectedDays}>
                                    <SelectTrigger className="w-[120px] h-9 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="30 Days" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
                                        <SelectItem value="7" className="rounded-lg">Last 7D</SelectItem>
                                        <SelectItem value="14" className="rounded-lg">Last 14D</SelectItem>
                                        <SelectItem value="30" className="rounded-lg">Last 30D</SelectItem>
                                        <SelectItem value="90" className="rounded-lg">Last 90D</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                                    <SelectTrigger className="w-[160px] h-9 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-primary/20">
                                        <Filter className="h-3.5 w-3.5 mr-2 opacity-50" />
                                        <SelectValue placeholder="All Platforms" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg">All Platforms</SelectItem>
                                        <SelectItem value="instagram" className="rounded-lg">Instagram</SelectItem>
                                        <SelectItem value="facebook" className="rounded-lg">Facebook</SelectItem>
                                        <SelectItem value="linkedin" className="rounded-lg">LinkedIn</SelectItem>
                                        <SelectItem value="youtube" className="rounded-lg">YouTube</SelectItem>
                                        <SelectItem value="x" className="rounded-lg">X (Twitter)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        {isUpdating && (
                            <div className="absolute inset-0 z-50 bg-white/20 dark:bg-black/20 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                            </div>
                        )}
                        <div className={`w-full pt-6 transition-opacity duration-300 ${isUpdating ? 'opacity-30' : 'opacity-100'}`}>
                            {volumeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={450}>
                                    <AreaChart
                                        data={volumeData}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E1306C" stopOpacity={0.2} /><stop offset="95%" stopColor="#E1306C" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="colorFacebook" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4267B2" stopOpacity={0.2} /><stop offset="95%" stopColor="#4267B2" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="colorLinkedin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0077b5" stopOpacity={0.2} /><stop offset="95%" stopColor="#0077b5" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="colorYoutube" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff0000" stopOpacity={0.2} /><stop offset="95%" stopColor="#ff0000" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="colorX" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#000000" stopOpacity={0.2} /><stop offset="95%" stopColor="#000000" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                                            tickFormatter={(str) => {
                                                const date = new Date(str);
                                                return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' }).toUpperCase()}`;
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const date = new Date(label);
                                                    const platformsList = [
                                                        { name: 'Instagram', key: 'instagram', color: '#E1306C' },
                                                        { name: 'Facebook', key: 'facebook', color: '#4267B2' },
                                                        { name: 'LinkedIn', key: 'linkedin', color: '#0077b5' },
                                                        { name: 'YouTube', key: 'youtube', color: '#ff0000' },
                                                        { name: 'X', key: 'x', color: '#000000' }
                                                    ];

                                                    return (
                                                        <div className="bg-white/95 dark:bg-black/95 backdrop-blur-2xl p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl text-gray-900 dark:text-white min-w-[200px]">
                                                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                                                                <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Node Telemetry</span>
                                                                <Badge variant="secondary" className="text-[9px] font-mono">{date.toLocaleDateString()}</Badge>
                                                            </div>
                                                            <div className="space-y-2.5">
                                                                {selectedPlatform === "all" ? platformsList.map(p => (
                                                                    <div key={p.key} className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                                            <span className="text-[11px] font-bold opacity-80">{p.name}</span>
                                                                        </div>
                                                                        <span className="text-xs font-black">{payload[0].payload[p.key] || 0}</span>
                                                                    </div>
                                                                )) : (
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: platformsList.find(p => p.key === selectedPlatform)?.color }} />
                                                                            <span className="text-[11px] font-bold opacity-80 capitalize">{selectedPlatform}</span>
                                                                        </div>
                                                                        <span className="text-xs font-black">{payload[0].value}</span>
                                                                    </div>
                                                                )}
                                                                <div className="pt-2 mt-1 border-t border-gray-100 dark:border-gray-800 flex items-baseline justify-between">
                                                                    <p className="text-[10px] font-black uppercase opacity-60">Total volume</p>
                                                                    <p className="text-xl font-black text-primary tracking-tighter">{payload[0].payload.posts}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        {selectedPlatform === "all" ? [
                                            { key: 'instagram', color: '#E1306C', grad: 'colorInstagram' },
                                            { key: 'facebook', color: '#4267B2', grad: 'colorFacebook' },
                                            { key: 'linkedin', color: '#0077b5', grad: 'colorLinkedin' },
                                            { key: 'youtube', color: '#ff0000', grad: 'colorYoutube' },
                                            { key: 'x', color: '#000000', grad: 'colorX' }
                                        ].map(p => (
                                            <Area
                                                key={p.key}
                                                type="monotone"
                                                dataKey={p.key}
                                                stroke={p.color}
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill={`url(#${p.grad})`}
                                                dot={false}
                                                activeDot={{ r: 4, strokeWidth: 0 }}
                                                stackId="1"
                                            />
                                        )) : (
                                            <Area
                                                type="monotone"
                                                dataKey={selectedPlatform === "all" ? "posts" : selectedPlatform}
                                                stroke={
                                                    selectedPlatform === "instagram" ? "#E1306C" :
                                                        selectedPlatform === "facebook" ? "#4267B2" :
                                                            selectedPlatform === "linkedin" ? "#0077b5" :
                                                                selectedPlatform === "youtube" ? "#ff0000" :
                                                                    selectedPlatform === "x" ? "#000000" : "#6366f1"
                                                }
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill={`url(#${selectedPlatform === "instagram" ? "colorInstagram" :
                                                    selectedPlatform === "facebook" ? "colorFacebook" :
                                                        selectedPlatform === "linkedin" ? "colorLinkedin" :
                                                            selectedPlatform === "youtube" ? "colorYoutube" :
                                                                selectedPlatform === "x" ? "colorX" : "colorVolume"
                                                    })`}
                                                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 8, strokeWidth: 0 }}
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[400px] items-center justify-center text-muted-foreground italic font-medium">
                                    Temporal data pending initialization...
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
