import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    iconBgColor = "bg-[#dbeafe]",
    iconColor = "text-[#2563eb]",
    gradientFrom = "from-[#eff6ff]",
    gradientTo = "to-[#dbeafe]",
    borderColor = "border-[#bfdbfe]",
    textColor = "text-[#1e40af]",
    valueColor = "text-[#1e3a8a]",
    loading = false,
}) => {
    return (
        <Card className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} ${borderColor} shadow-sm`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${textColor}`}>
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-full ${iconBgColor}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${valueColor}`}>
                    {loading ? <div className="h-8 w-16 animate-pulse bg-black/10 rounded" /> : value}
                </div>
                {description && (
                    <p className={`text-xs ${textColor} mt-1 opacity-80`}>{description}</p>
                )}
            </CardContent>
        </Card>
    );
};

export default StatCard;
