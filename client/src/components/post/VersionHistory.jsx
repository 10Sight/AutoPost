import React from "react";
import { format } from "date-fns";
import {
    History,
    RotateCcw,
    User as UserIcon,
    Calendar,
    ChevronRight,
    Loader2
} from "lucide-react";
import {
    useGetPostVersionsQuery,
    useRollbackPostVersionMutation
} from "../../features/posts/postsApi";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { toast } from "sonner";

const VersionHistory = ({ postId, onRollbackSuccess }) => {
    const { data: versionsData, isLoading, isError } = useGetPostVersionsQuery(postId);
    const [rollback, { isLoading: isRollingBack }] = useRollbackPostVersionMutation();

    const handleRollback = async (versionNumber) => {
        try {
            await rollback({ postId, versionNumber }).unwrap();
            toast.success(`Rolled back to version ${versionNumber}`);
            if (onRollbackSuccess) onRollbackSuccess();
        } catch (error) {
            toast.error(error.data?.message || "Rollback failed");
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>;
    if (isError) return <div className="text-center p-4 text-red-500">Failed to load version history</div>;

    const versions = versionsData?.data || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Version History</h3>
            </div>

            {versions.length === 0 ? (
                <p className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">No history found</p>
            ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    {versions.map((version, index) => (
                        <Card key={version._id} className={`group border-none shadow-sm transition-all hover:shadow-md ${index === 0 ? 'bg-primary/5 border border-primary/10' : 'bg-white/50 dark:bg-gray-900/50'}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={index === 0 ? "default" : "secondary"} className="h-5 text-[10px] uppercase font-bold">
                                                v{version.versionNumber}
                                            </Badge>
                                            {index === 0 && <span className="text-[10px] font-bold text-primary uppercase">Current</span>}
                                        </div>
                                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mt-1">
                                            {version.caption || <span className="italic opacity-50">No caption</span>}
                                        </p>
                                    </div>
                                    {index !== 0 && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRollback(version.versionNumber)}
                                            disabled={isRollingBack}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                        <UserIcon className="h-3 w-3" />
                                        <span>{version.createdBy?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        <span>{format(new Date(version.createdAt), 'MMM d, HH:mm')}</span>
                                    </div>
                                </div>
                                {version.changeLog && (
                                    <p className="text-[10px] text-primary/70 mt-2 bg-primary/5 px-2 py-1 rounded">
                                        Note: {version.changeLog}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VersionHistory;
