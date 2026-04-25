import React from 'react';
import { 
    Activity, 
    ShieldCheck, 
    BarChart3, 
    Clock, 
    HardDrive, 
    Users, 
    Globe, 
    AlertCircle,
    Calendar,
    ArrowUpRight,
    CheckCircle2,
    Lock,
    Zap,
    Youtube
} from "lucide-react";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useGetAccountUsageQuery } from "../redux/slices/usageApiSlice";
import { cn } from "../lib/utils";
import { format, differenceInDays } from "date-fns";
import { Skeleton } from "../components/ui/skeleton";

const AccountStatus = () => {
    const { data: usageData, isLoading, isError, refetch } = useGetAccountUsageQuery();

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] w-full rounded-2xl" />
                    <Skeleton className="h-[400px] w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold">Failed to load account status</h2>
                <p className="text-slate-500 max-w-xs text-center">There was an issue fetching your organization usage data.</p>
                <Button onClick={refetch} variant="outline" className="rounded-xl">Try Again</Button>
            </div>
        );
    }

    const { organization, usage } = usageData.data;
    const daysUntilReset = differenceInDays(new Date(usage.cycleEnd), new Date());

    const metrics = [
        {
            label: "Monthly Posts",
            used: usage.postsUsed,
            limit: usage.postsLimit,
            icon: BarChart3,
            color: "blue",
            unit: "posts"
        },
        {
            label: "Cloud Storage",
            used: usage.storageUsedBytes,
            limit: usage.storageLimitBytes,
            icon: HardDrive,
            color: "indigo",
            isStorage: true
        },
        {
            label: "Team Members",
            used: usage.teamUsed,
            limit: usage.teamLimit,
            icon: Users,
            color: "emerald",
            unit: "seats"
        },
        {
            label: "Platforms",
            used: usage.platformsUsed,
            limit: usage.platformsLimit,
            icon: Globe,
            color: "violet",
            unit: "accounts"
        }
    ];

    const formatStorage = (bytes) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <ShieldCheck className="w-5 h-5 text-slate-600" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">Account Status</h1>
                    </div>
                    <p className="text-slate-500 dark:text-gray-400 font-medium max-w-xl">
                        Real-time overview of your organization's health, subscription standing, and usage quotas.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pl-4 pr-2 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Status</span>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 leading-none capitalize">
                            {organization.status}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-100 bg-white dark:bg-slate-900 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden group">
                    <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</CardTitle>
                        <Zap className="w-4 h-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Standard Pro</div>
                        <p className="text-xs font-medium text-slate-500">Perfect for growing content teams</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 bg-white dark:bg-slate-900 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden group">
                    <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Reset Cycle</CardTitle>
                        <Clock className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{daysUntilReset} Days</div>
                        <p className="text-xs font-medium text-slate-500 underline decoration-blue-500/30">Next reset {format(new Date(usage.cycleEnd), "MMM dd")}</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 bg-white dark:bg-slate-900 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden group">
                    <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">System Health</CardTitle>
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">100.0%</div>
                        <p className="text-xs font-medium text-slate-500">All systems operational</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Usage Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-600" /> Usage Metrics
                        </h3>
                        <Badge variant="outline" className="rounded-full bg-slate-50 font-semibold text-[10px] uppercase">Real-time sync</Badge>
                    </div>

                    <div className="space-y-10">
                        {metrics.map((metric) => {
                            const percent = Math.min(100, Math.round((metric.used / metric.limit) * 100));
                            const isNearLimit = percent > 85;

                            return (
                                <div key={metric.label} className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2.5 rounded-xl border transition-all duration-300",
                                                metric.color === 'blue' ? "bg-blue-50 border-blue-100 text-blue-600" :
                                                metric.color === 'emerald' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                metric.color === 'indigo' ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                                                "bg-violet-50 border-violet-100 text-violet-600"
                                            )}>
                                                <metric.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{metric.label}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {metric.isStorage ? formatStorage(metric.used) : metric.used} of {metric.isStorage ? formatStorage(metric.limit) : metric.limit} {metric.unit || ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "font-bold text-lg",
                                            isNearLimit ? "text-rose-500" : "text-slate-900 dark:text-white"
                                        )}>
                                            {percent}%
                                        </div>
                                    </div>
                                    <div className="relative pt-1">
                                        <Progress 
                                            value={percent} 
                                            className="h-2.5 bg-slate-100 dark:bg-slate-800" 
                                            indicatorClassName={cn(
                                                percent > 90 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" : 
                                                percent > 75 ? "bg-amber-500" :
                                                metric.color === 'blue' ? "bg-blue-600" :
                                                metric.color === 'emerald' ? "bg-emerald-500" :
                                                metric.color === 'indigo' ? "bg-indigo-600" :
                                                "bg-violet-600"
                                            )}
                                        />
                                    </div>
                                    {isNearLimit && (
                                        <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-semibold uppercase tracking-wide">
                                            <AlertCircle className="w-3 h-3" /> Reaching capacity limit
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-8">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-600" /> Platform Insights
                    </h3>
                    
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-gray-800 space-y-10">
                        {/* YouTube Quota Info */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-gray-800 flex items-center justify-center">
                                        <Youtube className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">YouTube API Quota</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global platform limit</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold">{usage.youtubeQuotaUsed} / {usage.youtubeQuotaLimit}</div>
                                    <div className="text-[10px] font-bold text-emerald-500 uppercase">Available</div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-200/50 dark:bg-gray-800" />

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group cursor-help">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">Data Center</span>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase">Mumbai, Asia-South1</span>
                                </div>
                                <Badge className="ml-auto bg-emerald-500 text-white font-black text-[9px] px-2">Primary</Badge>
                            </div>

                            <div className="flex items-center gap-4 group cursor-help">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                                    <Activity className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold">Post Success Rate</span>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase">Last 30 days</span>
                                </div>
                                <span className="ml-auto text-xs font-bold text-emerald-500">99.2%</span>
                            </div>

                            <div className="flex items-center gap-4 group cursor-help">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">Registration Date</span>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase">{format(new Date(organization.createdAt || Date.now()), "dd MMM yyyy")}</span>
                                </div>
                                <ArrowUpRight className="ml-auto w-4 h-4 text-slate-300" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Support Standing</h4>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm font-bold">Priority Tier Alpha</div>
                                    <div className="text-[10px] font-semibold text-slate-500 uppercase">24/7 dedicated escalation active</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-center pt-10">
                <Button variant="outline" className="rounded-2xl h-12 px-8 border-slate-200 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 transition-all font-bold gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Request Quota Increase
                </Button>
            </div>
        </div>
    );
};

export default AccountStatus;
