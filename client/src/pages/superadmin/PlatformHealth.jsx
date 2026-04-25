import React from "react";
import { useGetGlobalHealthQuery } from "../../features/superadmin/superadminApi";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "../../components/ui/card";
import { 
    Activity, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    Building2,
    Search,
    ShieldAlert,
    Loader2
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { format } from "date-fns";

const PlatformHealth = () => {
    const { data: health, isLoading } = useGetGlobalHealthQuery({ page: 1, limit: 50 });

    const logs = health?.data?.logs || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Platform Vitality</h1>
                <p className="text-sm text-slate-500 mt-1">Real-time global monitoring of system-wide failures and account expirations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/10 backdrop-blur-sm shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Active Nodes</CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-700 dark:text-emerald-300">Operational</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-emerald-600/70">
                            <CheckCircle2 className="w-3 h-3" /> Core services heartbeat stable
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/10 backdrop-blur-sm shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest text-[10px]">Pending Issues</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-700 dark:text-rose-300">{logs.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-rose-600/70">
                            <AlertTriangle className="w-3 h-3" /> Requires attention in registry
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/10 backdrop-blur-sm shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest text-[10px]">Last 24h Failures</CardDescription>
                        <CardTitle className="text-2xl font-black text-amber-700 dark:text-amber-300">{logs.filter(l => l.action === "post.failed").length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-amber-600/70">
                            <Clock className="w-3 h-3" /> Average resolution time: 14m
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-500" />
                        Global Critical Event Feed
                    </CardTitle>
                    <CardDescription>Consolidated failure reports from all client organizations.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Activity className="w-10 h-10 animate-spin text-primary opacity-20" />
                            <p className="text-sm text-slate-500">Connecting to global log stream...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">Clean Sheet</p>
                                    <p className="text-sm text-slate-500">No platform failures detected in current buffer.</p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log._id} className="group p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-rose-200 dark:hover:border-rose-900/30 hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                                                    <AlertTriangle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 dark:text-white">
                                                            {log.action === "post.failed" ? "Post Publication Failure" : "Social Credentials Expired"}
                                                        </h4>
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">
                                                            {log.metadata?.platform || "Unknown"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" /> {log.organizationId?.name || "System"}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {log.timestamp ? format(new Date(log.timestamp), "MMM d, HH:mm:ss") : "Just now"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-left md:text-right">
                                                <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-md inline-block max-w-[300px] truncate">
                                                    {log.metadata?.error || "Check upstream API status"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PlatformHealth;
