import React from "react";
import { useGetRulesQuery } from "../features/rules/rulesApiSlice";
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
import { Loader2, Gavel, AlertTriangle, ShieldCheck, Info, MessageSquare } from "lucide-react";
import { Badge } from "../components/ui/badge";

const getTriggerBadge = (trigger) => {
    switch (trigger) {
        case "BEFORE_SCHEDULE":
            return <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50/50">Post Creation</Badge>;
        case "POST_PUBLISHED":
            return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-50/50">After Success</Badge>;
        case "POST_FAILED":
            return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-50/50">On Failure</Badge>;
        default:
            return <Badge variant="outline">{trigger}</Badge>;
    }
};

const getActionTypeIcon = (type) => {
    switch (type) {
        case "BLOCK":
            return <ShieldCheck className="w-4 h-4 text-red-500" />;
        case "WARN":
            return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        case "NOTIFY":
            return <Info className="w-4 h-4 text-blue-500" />;
        case "LOG":
            return <MessageSquare className="w-4 h-4 text-gray-500" />;
        default:
            return null;
    }
};

export default function PolicyRules() {
    const { data, isLoading, isError } = useGetRulesQuery();

    const rules = data?.data || [];

    return (
        <div className="p-4 md:p-8 pt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Policy Rules</h1>
                <p className="text-muted-foreground mt-1">
                    Organization-wide automated policies and enforcement rules.
                </p>
            </div>

            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-primary" />
                        Active Policies
                    </CardTitle>
                    <CardDescription>
                        These rules are automatically evaluated by the engine to ensure consistency and compliance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 text-destructive">
                            Failed to load policy rules. Please try again.
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No rules defined for your organization yet.
                        </div>
                    ) : (
                        <div className="rounded-md border border-border/50">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[200px] whitespace-normal">Rule Name</TableHead>
                                        <TableHead className="whitespace-normal">Trigger</TableHead>
                                        <TableHead className="whitespace-normal">Conditions</TableHead>
                                        <TableHead className="whitespace-normal">System Actions</TableHead>
                                        <TableHead className="text-right whitespace-normal">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rules.map((rule) => (
                                        <TableRow key={rule._id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-semibold whitespace-normal">
                                                <div className="flex flex-col">
                                                    <span>{rule.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                        {rule.description}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-normal">
                                                {getTriggerBadge(rule.trigger)}
                                            </TableCell>
                                            <TableCell className="whitespace-normal">
                                                <div className="flex flex-wrap gap-1">
                                                    {rule.conditions.length > 0 ? rule.conditions.map((cond, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-auto">
                                                            {cond.field} {cond.operator} {JSON.stringify(cond.value)}
                                                        </Badge>
                                                    )) : <span className="text-[10px] text-muted-foreground italic">No conditions (Always trigger)</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-normal">
                                                <div className="space-y-1">
                                                    {rule.actions.map((action, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-xs">
                                                            {getActionTypeIcon(action.type)}
                                                            <span className="font-medium text-[10px] text-gray-500 uppercase">{action.type}:</span>
                                                            <span className="text-muted-foreground">{action.message}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right whitespace-normal">
                                                <Badge className={rule.active ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-gray-500/10 text-gray-500"}>
                                                    {rule.active ? "Enabled" : "Disabled"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
