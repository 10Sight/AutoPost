import React from "react";
import { Filter } from "lucide-react";
import { useGetGroupsQuery } from "../../features/accountGroups/accountGroupsApi";
import { useGetConnectedAccountsQuery } from "../../features/socialAccounts/socialAccountsApi";
import PlatformIcon from "./PlatformIcon";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { cn } from "@/lib/utils";

const MAX_PLATFORM_ICONS = 4;

// Group.accounts is populated by the API, but fall back to an accountId -> account
// lookup in case a caller ever receives raw ObjectId references instead.
function resolveGroupAccounts(group, accountsById) {
    if (!group?.accounts?.length) return [];
    return group.accounts
        .map((entry) => {
            if (entry && typeof entry === "object") return entry;
            return accountsById.get(entry) || null;
        })
        .filter(Boolean);
}

const GroupFilter = ({
    selectedGroup,
    setSelectedGroup,
    globalLabel = "Global View",
    containerClassName = "",
}) => {
    const { data: groupsData } = useGetGroupsQuery();
    const { data: accountsData } = useGetConnectedAccountsQuery();

    const groups = groupsData?.data || [];

    const accountsById = React.useMemo(() => {
        const map = new Map();
        (accountsData?.data || []).forEach((acc) => map.set(acc._id, acc));
        return map;
    }, [accountsData]);

    const groupMeta = React.useMemo(() => {
        const meta = new Map();
        groups.forEach((group) => {
            const accounts = resolveGroupAccounts(group, accountsById);
            const platforms = [...new Set(accounts.map((a) => a.platform).filter(Boolean))];
            meta.set(group._id, { count: accounts.length, platforms });
        });
        return meta;
    }, [groups, accountsById]);

    // Stale-group recovery: if the previously selected group (often restored from
    // localStorage) no longer exists once groups have loaded, fall back to "all".
    React.useEffect(() => {
        if (!groupsData || selectedGroup === "all") return;
        const exists = groups.some((g) => g._id === selectedGroup);
        if (!exists) setSelectedGroup("all");
    }, [groupsData, groups, selectedGroup, setSelectedGroup]);

    const selectedLabel =
        selectedGroup === "all"
            ? globalLabel
            : groups.find((g) => g._id === selectedGroup)?.name || globalLabel;

    return (
        <div
            className={cn(
                "flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 group/select w-[180px] h-9",
                containerClassName
            )}
        >
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-full h-full border-none bg-transparent px-2 text-xs font-semibold text-slate-600 dark:text-slate-400 focus:ring-0 transition-colors group-hover/select:text-primary">
                    <div className="flex items-center min-w-0">
                        <Filter className="h-3.5 w-3.5 mr-2 shrink-0 text-primary/60 group-hover/select:text-primary transition-colors" />
                        <SelectValue placeholder="Select Group">
                            <span className="truncate">{selectedLabel}</span>
                        </SelectValue>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-98 duration-300 ease-out">
                    <SelectItem
                        value="all"
                        className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors rounded-lg mx-1"
                    >
                        {globalLabel}
                    </SelectItem>
                    {groups.length > 0 && (
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                    )}
                    {groups.map((group) => {
                        const meta = groupMeta.get(group._id) || { count: 0, platforms: [] };
                        return (
                            <SelectItem
                                key={group._id}
                                value={group._id}
                                className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-colors rounded-lg mx-1 py-2"
                            >
                                <div className="flex items-center justify-between gap-3 w-full min-w-0">
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate">{group.name}</span>
                                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                                            {meta.count} account{meta.count === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                    {meta.platforms.length > 0 && (
                                        <div className="flex items-center -space-x-1 shrink-0">
                                            {meta.platforms.slice(0, MAX_PLATFORM_ICONS).map((platform) => (
                                                <div
                                                    key={platform}
                                                    className="ring-2 ring-white dark:ring-slate-950 rounded-full bg-white dark:bg-slate-950"
                                                >
                                                    <PlatformIcon platform={platform} className="h-3 w-3" />
                                                </div>
                                            ))}
                                            {meta.platforms.length > MAX_PLATFORM_ICONS && (
                                                <span className="text-[9px] font-bold text-slate-400 pl-1.5">
                                                    +{meta.platforms.length - MAX_PLATFORM_ICONS}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
};

export default GroupFilter;
