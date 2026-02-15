import React from 'react';
import { useGetUsageQuery } from '../../redux/slices/usageApiSlice';
import { Progress } from "../../components/ui/progress";
import {
    FileText,
    Share2,
    HardDrive,
    Users,
    ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "../ui/button";

const UsageStats = () => {
    const { data: usageResponse, isLoading } = useGetUsageQuery();
    const usage = usageResponse?.data;

    if (isLoading) {
        return <div className="animate-pulse h-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />;
    }

    if (!usage) return null;

    const metrics = [
        {
            label: 'Monthly Posts',
            used: usage.postsUsed,
            limit: usage.postsLimit,
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            barColor: 'bg-blue-600'
        },
        {
            label: 'Connected Platforms',
            used: usage.platformsUsed,
            limit: usage.platformsLimit,
            icon: Share2,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            barColor: 'bg-purple-600'
        },
        {
            label: 'Media Storage',
            used: (usage.storageUsedBytes / (1024 * 1024)).toFixed(1),
            limit: (usage.storageLimitBytes / (1024 * 1024)).toFixed(1),
            unit: 'MB',
            icon: HardDrive,
            color: 'text-amber-600',
            bg: 'bg-amber-100',
            barColor: 'bg-amber-600'
        },
        {
            label: 'Team Members',
            used: usage.teamUsed,
            limit: usage.teamLimit,
            icon: Users,
            color: 'text-green-600',
            bg: 'bg-green-100',
            barColor: 'bg-green-600'
        }
    ];

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    Usage & Limits
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Cycle resets in {Math.ceil((new Date(usage.cycleEnd) - new Date()) / (1000 * 60 * 60 * 24))} days
                </span>
            </div>

            <div className="p-5 grid gap-4">
                {metrics.map((m) => {
                    const percentage = (m.used / m.limit) * 100;
                    const isNearLimit = percentage > 80;

                    return (
                        <div key={m.label} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-md ${m.bg} ${m.color}`}>
                                        <m.icon className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{m.label}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-bold ${isNearLimit ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {m.used} / {m.limit}
                                    </span>
                                    {m.unit && <span className="text-xs text-muted-foreground ml-1">{m.unit}</span>}
                                </div>
                            </div>
                            <Progress value={percentage} className="h-1.5" indicatorClassName={m.barColor} />
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
                <Link to="/dashboard/org-settings">
                    <Button variant="ghost" size="sm" className="w-full text-xs gap-2 group">
                        Manage Subscriptions <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default UsageStats;
