import React from "react";
import { useGetAnalyticsQuery } from "../features/posts/postsApi";
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
import { Loader2, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";

const Analytics = () => {
    const { data: analyticsData, isLoading } = useGetAnalyticsQuery();

    // Safely access data
    const platformData = analyticsData?.data?.platformDistribution || [];
    const statusData = analyticsData?.data?.statusDistribution || [];
    const volumeData = analyticsData?.data?.volumeData || [];

    // Colors for charts
    const PLATFORM_COLORS = {
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
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Analytics</h2>
                    <p className="text-muted-foreground">Detailed insights into your scheduling performance.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Platform Distribution */}
                <Card className="col-span-3 border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-primary" />
                            Platform Distribution
                        </CardTitle>
                        <CardDescription>
                            Where your content is being scheduled.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full">
                            {platformData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={platformData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {platformData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={PLATFORM_COLORS[entry.name] || "#8884d8"}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                                    No platform data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Status Breakdown */}
                <Card className="col-span-4 border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-500" />
                            Engagement Status
                        </CardTitle>
                        <CardDescription>
                            Success vs. Pending vs. Failed posts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full">
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={statusData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#8884d8"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                                    No status data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Publishing Volume Trends */}
                <Card className="col-span-7 border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            30-Day Publishing Volume
                        </CardTitle>
                        <CardDescription>
                            Daily posting frequency over the last month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full">
                            {volumeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart
                                        data={volumeData}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" tickFormatter={(str) => {
                                            const date = new Date(str);
                                            return `${date.getMonth() + 1}/${date.getDate()}`;
                                        }} />
                                        <YAxis />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="posts" stroke="#8884d8" fillOpacity={1} fill="url(#colorPosts)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                                    No volume data available
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
