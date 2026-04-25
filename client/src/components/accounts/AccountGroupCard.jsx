import React, { useState } from "react";
import { 
    MoreVertical, 
    Edit, 
    Trash2, 
    ChevronDown, 
    ChevronUp,
    FolderOpen,
    PlusCircle
} from "lucide-react";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "../ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";

const AccountGroupCard = ({ 
    group, 
    onEdit, 
    onDelete, 
    children, 
    isEmpty 
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FolderOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h2>
                            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-normal">
                                {group.accounts?.length || 0} Accounts
                            </Badge>
                        </div>
                        {group.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{group.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-500"
                    >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(group)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Label
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onDelete(group._id)} 
                                className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Group
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {isExpanded && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {isEmpty ? (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-gray-50/30 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800">
                             <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                                <PlusCircle className="h-6 w-6 text-gray-400" />
                             </div>
                             <p className="text-sm text-muted-foreground">No accounts in this group yet.</p>
                             <p className="text-xs text-muted-foreground/60 mt-1">Add accounts to organize your workspace.</p>
                        </div>
                    ) : (
                        children
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountGroupCard;
