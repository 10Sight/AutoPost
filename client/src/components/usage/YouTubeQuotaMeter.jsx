import React from "react";
import { useGetYouTubeQuotaMetricsQuery } from "../../features/socialAccounts/socialAccountsApi";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "../ui/card";
import { Progress } from "../ui/progress";
import { Youtube, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "../ui/badge";

const YouTubeQuotaMeter = () => {
    const { data: quotaData, isLoading, error } = useGetYouTubeQuotaMetricsQuery(null, {
        pollingInterval: 30000, // Refresh every 30 seconds
    });

    if (isLoading) return <div className="h-48 w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />;

    if (error) {
        // SaaS-ready: Fail gracefully but provide a hint if it's an API issue
        // Don't show raw JSON to end users
        if (error.status === 403) return null; // Likely permission issue, hide silently
        return null; // For now, we prefer to hide the widget than show a broken one, as per typical dashboard patterns
    }

    const { global, organization } = quotaData?.data || {};

    // Safety check for metrics existence
    const hasOrgMetrics = organization && typeof organization.used === 'number';
    const hasGlobalMetrics = global && typeof global.used === 'number';

    const globalPercent = hasGlobalMetrics ? Math.min((global.used / global.limit) * 100, 100) : 0;
    const orgPercent = hasOrgMetrics ? Math.min((organization.used / organization.limit) * 100, 100) : 0;

    const getStatusColor = (percent) => {
        if (percent > 90) return "bg-red-500 shadow-red-500/20";
        if (percent > 70) return "bg-amber-500 shadow-amber-500/20";
        return "bg-green-500 shadow-green-500/20";
    };

    return (
        <Card className="border-gray-200 dark:border-gray-800 shadow-md overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-600" />
                        YouTube Quota Health
                    </CardTitle>
                    {hasGlobalMetrics ? (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border-red-100">
                            System Admin
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter bg-gray-100 text-gray-500 border-gray-200">
                            Organization
                        </Badge>
                    )}
                </div>
                <CardDescription className="text-[11px]">
                    Daily API limit monitoring
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                {/* Global Application Quota - Only show if available (admin) */}
                {hasGlobalMetrics && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-[11px] font-semibold text-gray-500 uppercase">System-Wide Usage</label>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                {global?.used.toLocaleString()} / {global?.limit.toLocaleString()}
                            </span>
                        </div>
                        <Progress value={globalPercent} indicatorClassName={getStatusColor(globalPercent)} />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground italic">
                            <span>Application limit</span>
                            {globalPercent > 80 && (
                                <span className="text-red-500 font-bold flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Critical
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Organization Quota */}
                {hasOrgMetrics ? (
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-[11px] font-semibold text-gray-500 uppercase">Your Org Usage</label>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                {organization?.used.toLocaleString()} / {organization?.limit.toLocaleString()}
                            </span>
                        </div>
                        <Progress value={orgPercent} indicatorClassName={getStatusColor(orgPercent)} />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground italic">
                            <span>Tenant fair use</span>
                            <span className="text-green-600 font-medium flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Active
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-[11px] text-muted-foreground text-center py-2">
                        No YouTube activity recorded for this organization today.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default YouTubeQuotaMeter;
