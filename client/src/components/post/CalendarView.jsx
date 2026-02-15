import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, MoreHorizontal, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";

const CalendarView = ({ posts, onDateClick }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getPostsForDay = (day) => {
        return posts.filter(post => isSameDay(new Date(post.scheduledAt), day));
    };

    const statusColors = {
        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
        posted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
        failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    };

    return (
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                    <div className="flex items-center rounded-md border border-gray-200 dark:border-gray-800">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-r-none border-r border-gray-200 dark:border-gray-800">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-l-none">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                {weekDays.map(day => (
                    <div key={day} className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
                {calendarDays.map((day, dayIdx) => {
                    const dayPosts = getPostsForDay(day);
                    const isSelectedMonth = isSameMonth(day, monthStart);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDateClick && onDateClick(day)}
                            className={cn(
                                "relative border-b border-r border-gray-200 dark:border-gray-800 p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer group",
                                !isSelectedMonth && "bg-gray-50/30 dark:bg-gray-900/30 text-gray-400",
                                isCurrentDay && "bg-blue-50/30 dark:bg-blue-900/10"
                            )}
                        >
                            <div className={cn(
                                "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full mb-1",
                                isCurrentDay ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300"
                            )}>
                                {format(day, 'd')}
                            </div>

                            <div className="space-y-1.5 overflow-y-auto max-h-[100px] scrollbar-hide">
                                {dayPosts.map((post) => (
                                    <TooltipProvider key={post._id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className={cn(
                                                    "text-xs p-1.5 rounded-md border flex items-center gap-1.5 truncate shadow-sm transition-all hover:scale-[1.02]",
                                                    statusColors[post.status] || "bg-gray-100 border-gray-200"
                                                )}>
                                                    {/* Icon based on platform */}
                                                    <Avatar className="h-3.5 w-3.5">
                                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${post.platforms?.[0] || 'P'}&background=random`} />
                                                        <AvatarFallback className="text-[8px]">{post.platforms?.[0]?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate font-medium">{format(new Date(post.scheduledAt), 'h:mm a')}</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-xs">{post.platforms?.[0]} Post</p>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(post.scheduledAt), 'h:mm a')}</p>
                                                    <p className="text-xs max-w-[200px] break-words line-clamp-2">"{post.caption}"</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>

                            {/* Add button on hover */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                    <PlusIcon className="h-3 w-3" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PlusIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </svg>
);

export default CalendarView;
