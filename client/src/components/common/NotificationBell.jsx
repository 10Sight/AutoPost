import React, { useState } from "react";
import { Bell, Check, Trash2, X, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import {
    useGetNotificationsQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation
} from "../../features/notifications/notificationsApi";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const NotificationIcon = ({ type }) => {
    switch (type) {
        case "SUCCESS": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case "ERROR": return <AlertCircle className="h-4 w-4 text-red-500" />;
        case "WARNING": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        default: return <Info className="h-4 w-4 text-blue-500" />;
    }
};

const NotificationBell = () => {
    const { data: notificationsData, isLoading } = useGetNotificationsQuery();
    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();

    const notifications = notificationsData?.data || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await markAsRead(id).unwrap();
        } catch (err) {
            toast.error("Failed to mark notification as read");
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead().unwrap();
            toast.success("All notifications marked as read");
        } catch (err) {
            toast.error("Failed to mark all as read");
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await deleteNotification(id).unwrap();
            toast.success("Notification deleted");
        } catch (err) {
            toast.error("Failed to delete notification");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in duration-300">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0 mr-4" align="end shadow-xl">
                <DropdownMenuLabel className="p-4 flex items-center justify-between">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-primary hover:text-primary/80"
                            onClick={handleMarkAllRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <ScrollArea className="h-80">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center gap-2">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-full p-3 text-gray-400">
                                <Bell className="h-6 w-6" />
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">No notifications yet</p>
                            <p className="text-xs text-muted-foreground/60">We'll alert you to important events here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`relative p-4 flex gap-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-default ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <NotificationIcon type={notification.type} />
                                    </div>
                                    <div className="flex-1 space-y-1 overflow-hidden">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm leading-tight ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                                                {notification.title}
                                            </p>
                                            <div className="flex gap-1">
                                                {!notification.read && (
                                                    <button
                                                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                                                        className="text-gray-400 hover:text-primary transition-colors p-1"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(notification._id, e)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/60">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-2">
                    <Button variant="ghost" className="w-full text-xs h-8 text-muted-foreground" disabled>
                        View all activity (Coming Soon)
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBell;
