import React from "react";
import { 
    TrendingUp, 
    Users, 
    Building2, 
    FileText, 
    ArrowUpRight,
    Loader2
} from "lucide-react";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    Legend
} from "recharts";

import { useGetGrowthMetricsQuery } from "../../features/superadmin/superadminApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

const GrowthMetrics = () => {
    const { data: response, isLoading, isError } = useGetGrowthMetricsQuery();
    const metrics = response?.data;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-3xl">
                <p className="text-rose-500 font-bold text-lg">Failed to load analytics</p>
                <p className="text-rose-400 text-sm">Please check your connection or permissions.</p>
            </div>
        );
    }

    // Prepare data for charts
    const formatMonth = (item) => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${monthNames[item._id.month - 1]} ${item._id.year}`;
    };

    const growthData = metrics?.growth?.organizations.map((org, index) => {
        const userCount = metrics.growth.users[index]?.count || 0;
        return {
            month: formatMonth(org),
            orgs: org.count,
            users: userCount
        };
    });

    const usageData = metrics?.growth?.posts.map(post => ({
        month: formatMonth(post),
        total: post.total,
        success: post.published,
        failed: post.failed
    }));

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Growth Metrics</h1>
                <p className="text-slate-500 font-medium">Global platform scale and usage analytics</p>
            </div>

            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-3xl border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full uppercase tracking-widest">
                                <ArrowUpRight className="w-3 h-3" /> Growth
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Organizations</p>
                            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">{metrics?.kpis?.totalOrganizations}</h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full uppercase tracking-widest">
                                <ArrowUpRight className="w-3 h-3" /> Active
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Total Users</p>
                            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">{metrics?.kpis?.totalUsers}</h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-full uppercase tracking-widest">
                                Total Vol
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Scheduled Posts</p>
                            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">{metrics?.kpis?.totalPosts}</h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full uppercase tracking-widest">
                                Linked
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Social Accounts</p>
                            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">{metrics?.kpis?.activeSocialAccounts}</h2>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Growth Chart */}
                <Card className="rounded-[40px] border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-xl font-bold tracking-tight">Platform Growth</CardTitle>
                        <CardDescription className="font-medium text-slate-400">New organizations & users joining the platform</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: "#94a3b8", fontSize: 12, fontWeight: 500}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: "#94a3b8", fontSize: 12, fontWeight: 500}}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '20px', 
                                        border: 'none', 
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                        padding: '16px'
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="orgs" 
                                    name="Organizations"
                                    stroke="#2563eb" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorOrgs)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="users" 
                                    name="Users"
                                    stroke="#8b5cf6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorUsers)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Usage Chart */}
                <Card className="rounded-[40px] border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-xl font-bold tracking-tight">System Usage</CardTitle>
                        <CardDescription className="font-medium text-slate-400">Total posts processed and success rates</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={usageData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: "#94a3b8", fontSize: 12, fontWeight: 500}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: "#94a3b8", fontSize: 12, fontWeight: 500}}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ 
                                        borderRadius: '20px', 
                                        border: 'none', 
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                        padding: '16px'
                                    }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: '600' }}
                                />
                                <Bar dataKey="success" name="Published" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                                <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
                                <Bar dataKey="total" name="Total Attempts" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Scale Management Info */}
            <Card className="rounded-[40px] bg-primary text-white border-none p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight">Scale Diagnostics</h2>
                        <p className="text-white/80 font-medium">
                            Your platform is currently supporting {metrics?.kpis?.totalOrganizations} organizations with {metrics?.kpis?.activeSocialAccounts} connected accounts. 
                            The system is operating at peak efficiency with a post success rate of {
                                metrics?.kpis?.totalPosts > 0 
                                ? Math.round((usageData?.[usageData.length-1]?.success / usageData?.[usageData.length-1]?.total) * 100) 
                                : 100
                            }% in the last month.
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <Button className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-8 font-bold text-lg transition-all shadow-xl shadow-black/10">
                            Download Growth Audit
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default GrowthMetrics;
