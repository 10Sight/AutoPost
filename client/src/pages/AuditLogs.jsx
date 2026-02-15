import React, { useState } from "react";
import { useGetAuditLogsQuery } from "../features/audit/auditApi";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const ACTION_TYPES = [
    "post.created",
    "post.published",
    "post.failed",
    "post.deleted",
    "post.retry.scheduled",
    "social.account.expired",
];

export default function AuditLogs() {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState("all");

    const { data, isLoading, isError } = useGetAuditLogsQuery({
        page,
        limit: 20,
        action: actionFilter === "all" ? undefined : actionFilter,
    });

    const logs = data?.data?.logs || [];
    const pagination = data?.data?.pagination;

    const getActionBadge = (action) => {
        switch (action) {
            case "post.published":
                return <Badge className="bg-green-500 hover:bg-green-600">Published</Badge>;
            case "post.failed":
                return <Badge variant="destructive">Failed</Badge>;
            case "post.deleted":
                return <Badge variant="destructive">Deleted</Badge>;
            case "post.retry.scheduled":
                return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Retry</Badge>;
            case "social.account.expired":
                return <Badge variant="destructive">Auth Error</Badge>;
            default:
                return <Badge variant="outline">{action}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                    <p className="text-muted-foreground mt-1">
                        Track system activities and security events.
                    </p>
                </div>

                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        {ACTION_TYPES.map((action) => (
                            <SelectItem key={action} value={action}>
                                {action}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" />
                        System Activity
                    </CardTitle>
                    <CardDescription>
                        Immutable record of all critical actions performed within the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 text-destructive">
                            Failed to load audit logs. Please try again.
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No audit logs found matching your criteria.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Entity ID</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log._id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                                            </TableCell>
                                            <TableCell>
                                                {log.userId ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{log.userId.fullName}</span>
                                                        <span className="text-xs text-muted-foreground">{log.userId.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">System</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getActionBadge(log.action)}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {log.entityId}
                                                <div className="text-[10px] text-muted-foreground">{log.entityType}</div>
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <code className="text-[10px] bg-muted px-1 py-0.5 rounded break-all block max-h-20 overflow-y-auto">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </code>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                Page {page} of {pagination.pages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                                disabled={page === pagination.pages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
