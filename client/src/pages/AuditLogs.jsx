import React, { useState } from "react";
import { useGetAuditLogsQuery } from "../features/audit/auditApi";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { useGetGroupsQuery } from "../features/accountGroups/accountGroupsApi";
import { 
    Loader2, 
    ChevronLeft, 
    ChevronRight, 
    ShieldAlert, 
    Copy, 
    CheckCircle2, 
    AlertCircle, 
    Trash2, 
    RefreshCcw, 
    KeyRound, 
    Instagram, 
    Facebook, 
    Linkedin, 
    Twitter, 
    Youtube, 
    ExternalLink,
    Filter
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";

const ACTION_LABELS = {
    "post.created": "Post Created",
    "post.published": "Post Published",
    "post.failed": "Post Failed",
    "post.deleted": "Post Deleted",
    "post.retry.scheduled": "Retry Scheduled",
    "social.account.expired": "Account Expired",
    "youtube.channel.connected": "YouTube Connected",
    "youtube.video.uploaded": "Video Uploaded",
};

const ACTION_TYPES = Object.keys(ACTION_LABELS);

const PlatformIcon = ({ platform }) => {
    switch (platform?.toLowerCase()) {
        case "instagram": return <Instagram className="h-4 w-4 text-pink-600" />;
        case "facebook": return <Facebook className="h-4 w-4 text-blue-600" />;
        case "linkedin": return <Linkedin className="h-4 w-4 text-blue-700" />;
        case "x": case "twitter": return <Twitter className="h-4 w-4 text-black dark:text-white" />;
        case "youtube": return <Youtube className="h-4 w-4 text-red-600" />;
        default: return null;
    }
};

export default function AuditLogs() {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState("all");
    const [selectedGroup, setSelectedGroup] = useState("all");

    const { data: groupsData } = useGetGroupsQuery();

    const { data, isLoading, isError } = useGetAuditLogsQuery({
        page,
        limit: 20,
        action: actionFilter === "all" ? undefined : actionFilter,
        groupId: selectedGroup === "all" ? undefined : selectedGroup,
    });

    const logs = data?.data?.logs || [];
    const pagination = data?.data?.pagination;

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const getActionBadge = (action) => {
        const label = ACTION_LABELS[action] || action;
        switch (action) {
            case "post.published":
            case "youtube.video.published":
                return <Badge className="bg-green-500 hover:bg-green-600 gap-1"><CheckCircle2 className="w-3 h-3" /> {label}</Badge>;
            case "post.failed":
            case "social.account.expired":
                return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> {label}</Badge>;
            case "post.deleted":
                return <Badge variant="outline" className="text-red-500 border-red-200 gap-1"><Trash2 className="w-3 h-3" /> {label}</Badge>;
            case "post.retry.scheduled":
                return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1"><RefreshCcw className="w-3 h-3" /> {label}</Badge>;
            default:
                return <Badge variant="outline">{label}</Badge>;
        }
    };

    const renderDetails = (log) => {
        const m = log.metadata || {};
        const platform = m.platform ? (
            <span className="inline-flex items-center gap-1 font-semibold capitalize ml-1">
                <PlatformIcon platform={m.platform} /> {m.platform}
            </span>
        ) : null;

        switch (log.action) {
            case "post.created":
                return (
                    <div className="text-sm">
                        New post created for {platform}.
                        {m.scheduledAt && <div className="text-xs text-muted-foreground">Scheduled for {format(new Date(m.scheduledAt), "PPp")}</div>}
                    </div>
                );
            case "post.published":
                return (
                    <div className="text-sm">
                        Successfully published to {platform}.
                        {m.platformPostId && <div className="text-xs text-muted-foreground font-mono">ID: {m.platformPostId}</div>}
                    </div>
                );
            case "post.failed":
                return (
                    <div className="text-sm">
                        Publication failed on {platform}.
                        {m.error && <div className="text-xs text-red-500 mt-1 font-medium bg-red-50 dark:bg-red-900/10 p-1.5 rounded border border-red-100 dark:border-red-900/20">{m.error}</div>}
                    </div>
                );
            case "social.account.expired":
                return (
                    <div className="text-sm">
                        {platform} account requires reconnection.
                        {m.error && <div className="text-xs text-muted-foreground mt-1 italic">Reason: {m.error}</div>}
                    </div>
                );
            case "post.retry.scheduled":
                return (
                    <div className="text-sm">
                        Attempt {m.retryCount + 1} failed. Next retry: 
                        <span className="font-medium ml-1 text-yellow-600">
                            {m.nextRetryAt ? format(new Date(m.nextRetryAt), "pp") : "soon"}
                        </span>
                    </div>
                );
            case "post.deleted":
                return <div className="text-sm">Post removed from schedule.</div>;
            default:
                return (
                    <div className="text-xs font-mono bg-muted p-1 rounded max-h-20 overflow-y-auto">
                        {JSON.stringify(m)}
                    </div>
                );
        }
    };

    return (
        <div className="p-4 md:p-8 pt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">Audit Logs</h1>
                    <p className="text-muted-foreground mt-1">
                        A detailed timeline of all system and user activities.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Group Filter Selector - Refined Premium Design */}
                    <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 group/select">
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger className="w-[180px] h-8 border-none bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 focus:ring-0 transition-colors group-hover/select:text-primary">
                                <div className="flex items-center">
                                    <Filter className="h-3.5 w-3.5 mr-2.5 text-primary/60 group-hover/select:text-primary transition-colors" />
                                    <SelectValue placeholder="Select Group" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                <SelectItem value="all" className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer rounded-lg mx-1">
                                    Global View
                                </SelectItem>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                                {groupsData?.data?.map((group) => (
                                    <SelectItem 
                                        key={group._id} 
                                        value={group._id} 
                                        className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer rounded-lg mx-1"
                                    >
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-[180px] h-11 border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-xl shadow-sm focus:ring-primary/20 hover:border-primary/30 transition-all duration-300 backdrop-blur-md">
                            <SelectValue placeholder="Action Type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-2xl">
                            <SelectItem value="all" className="text-xs font-semibold text-slate-500 cursor-pointer rounded-lg mx-1">Every Action</SelectItem>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                            {ACTION_TYPES.map((action) => (
                                <SelectItem key={action} value={action} className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer rounded-lg mx-1">
                                    {ACTION_LABELS[action]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl shadow-gray-200/20 dark:shadow-none">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" />
                        Activity Feed
                    </CardTitle>
                    <CardDescription>
                        Records are cryptographically secured and immutable.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                            <p className="text-sm text-muted-foreground animate-pulse">Fetching history...</p>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-20 text-destructive flex flex-col items-center gap-2">
                            <AlertCircle className="w-10 h-10 opacity-50" />
                            <p>Failed to load audit logs.</p>
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-2">
                            <ShieldAlert className="w-10 h-10 opacity-20" />
                            <p>No activity recorded yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="w-[140px]">Date & Time</TableHead>
                                        <TableHead className="w-[160px]">Initiator</TableHead>
                                        <TableHead className="w-[150px]">Action</TableHead>
                                        <TableHead className="min-w-[300px]">Event Details</TableHead>
                                        <TableHead className="w-[100px] text-right">Ref</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log._id} className="group hover:bg-muted/20 transition-colors">
                                            <TableCell className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>{format(new Date(log.timestamp), "MMM dd, yyyy")}</span>
                                                    <span className="text-primary/70">{format(new Date(log.timestamp), "HH:mm:ss")}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {log.userId ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                                                            {log.userId.fullName?.charAt(0) || "U"}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-semibold leading-tight truncate">{log.userId.fullName}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate">{log.userId.email}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <KeyRound className="w-4 h-4" />
                                                        <span className="text-xs font-medium italic">System</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex">{getActionBadge(log.action)}</div>
                                            </TableCell>
                                            <TableCell className="max-w-[400px]">
                                                <div className="break-words whitespace-normal">
                                                    {renderDetails(log)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => copyToClipboard(log.entityId, "Entity ID")}
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="left">
                                                                <p className="text-[10px]">ID: {log.entityId}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <div className="text-[10px] font-mono text-muted-foreground">
                                                        ...{log.entityId?.slice(-6)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex items-center justify-center space-x-6 py-6 border-t mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">
                                <span className="text-primary">{page}</span>
                                <span className="mx-1 text-muted-foreground">/</span>
                                <span className="text-muted-foreground">{pagination.pages}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
