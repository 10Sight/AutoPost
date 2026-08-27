import React from "react";
import {
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";
import { PLATFORM_META, PLATFORM_ORDER } from "@/lib/platformMeta";

const CHART_COLOR = "#2563eb";

const TIMEFRAMES = [
    { value: "7", label: "7 Days" },
    { value: "30", label: "30 Days" },
    { value: "90", label: "90 Days" },
];

// Chart data dates arrive as bare "YYYY-MM-DD"; parsing with an explicit local
// midnight avoids `new Date("YYYY-MM-DD")`'s UTC interpretation shifting the
// displayed day back by one for users behind UTC.
const parseLocalDate = (dateStr) => new Date(`${dateStr}T00:00:00`);

// Short axis label: weekday + day for the 7-day view, month + day beyond that.
const formatAxisTick = (dateStr, days) => {
    const d = parseLocalDate(dateStr);
    return Number(days) <= 7
        ? d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Full label for the tooltip, regardless of the selected window.
const formatTooltipDate = (dateStr) => {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
};

// Points per day the chart track needs so labels stay legible; beyond 7 points
// the track grows past the card width and the wrapper scrolls horizontally.
const PX_PER_POINT = 44;

// Rounds the chart's y-axis ceiling to a clean multiple of 10 so ticks read as 0/10/20/30...
const computeYAxisTicks = (chartData) => {
    const maxValue = chartData.reduce((max, d) => Math.max(max, d.total || 0), 0);
    const yMax = Math.max(10, Math.ceil((maxValue + 1) / 10) * 10);
    const tickCount = 5;
    const step = yMax / (tickCount - 1);
    const ticks = Array.from({ length: tickCount }, (_, i) => Math.round(i * step));
    return { yMax, ticks };
};

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const value = payload[0].value;

    return (
        <div className="relative flex flex-col items-center pointer-events-none">
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl px-4 py-2.5 shadow-xl text-center min-w-[110px]">
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">{formatTooltipDate(label)}</p>
                <p className="text-base font-black leading-none">{value} <span className="text-[10px] font-medium opacity-70">posts</span></p>
            </div>
            <div className="w-3 h-3 -mt-[6px] bg-gray-900 dark:bg-gray-100 rotate-45 rounded-[2px]" />
        </div>
    );
};

const GrowthBadge = ({ growth }) => {
    if (growth > 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">
                <ArrowUpRight className="h-3 w-3" />
                {growth}%
            </span>
        );
    }
    if (growth < 0) {
        return (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                <ArrowDownRight className="h-3 w-3" />
                {Math.abs(growth)}%
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gray-400">
            <Minus className="h-3 w-3" />
            0%
        </span>
    );
};

const PlatformCard = ({ platform, count, growth }) => {
    const meta = PLATFORM_META[platform];
    if (!meta) return null;
    const { name, Icon, bg } = meta;

    return (
        <div className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-900 hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-300 cursor-default">
            <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110", bg)}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-center">
                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-tight">{name}</p>
                <p className="text-lg font-black text-gray-900 dark:text-gray-100 leading-tight mt-0.5">{count}</p>
                <div className="mt-1">
                    <GrowthBadge growth={growth} />
                </div>
            </div>
        </div>
    );
};

const PlatformCardSkeleton = () => (
    <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-8 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
    </div>
);

const PerformanceOverview = ({
    chartData = [],
    platformStats = [],
    selectedDays,
    onSelectedDaysChange,
    isLoading = false,
    isFetching = false,
}) => {
    const { yMax, ticks } = React.useMemo(() => computeYAxisTicks(chartData), [chartData]);

    const platformStatsByKey = React.useMemo(() => {
        const map = new Map();
        platformStats.forEach((p) => map.set(p.platform, p));
        return map;
    }, [platformStats]);

    return (
        <Card className="col-span-4 border-gray-200 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary/10 text-primary">
                            <Activity className="h-4 w-4" />
                        </span>
                        Performance Overview
                    </CardTitle>

                    <Select value={String(selectedDays)} onValueChange={onSelectedDaysChange}>
                        <SelectTrigger className="w-[130px] h-9 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-400 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                            <SelectValue placeholder="7 Days" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl">
                            {TIMEFRAMES.map((tf) => (
                                <SelectItem key={tf.value} value={tf.value} className="text-xs font-medium rounded-lg mx-1">
                                    {tf.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <CardDescription>
                    Your posting activity trends and platform distribution.
                </CardDescription>
            </CardHeader>

            <CardContent className={cn("flex-1 pb-6 space-y-10 transition-opacity duration-300", isFetching && "opacity-60")}>
                <div className="flex flex-col pt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Volume Activity</h4>
                    {isLoading ? (
                        <div className="h-[280px] rounded-xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                    ) : (
                        <div className="overflow-x-auto overflow-y-hidden pb-2">
                            <div style={{ minWidth: chartData.length > 7 ? `${chartData.length * PX_PER_POINT}px` : "100%" }}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.35} />
                                                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(d) => formatAxisTick(d, selectedDays)}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            domain={[0, yMax]}
                                            ticks={ticks}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                                            width={28}
                                        />
                                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_COLOR, strokeWidth: 1, strokeDasharray: "4 4" }} />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stroke={CHART_COLOR}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorPerformance)"
                                            dot={{ r: 3, fill: CHART_COLOR, strokeWidth: 2, stroke: "#fff" }}
                                            activeDot={{ r: 6, fill: CHART_COLOR, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col border-t border-gray-100 dark:border-gray-800 pt-8">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Platform Performance</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => <PlatformCardSkeleton key={i} />)
                            : PLATFORM_ORDER.map((platform) => {
                                  const stat = platformStatsByKey.get(platform) || { count: 0, growth: 0 };
                                  return (
                                      <PlatformCard
                                          key={platform}
                                          platform={platform}
                                          count={stat.count}
                                          growth={stat.growth}
                                      />
                                  );
                              })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PerformanceOverview;
