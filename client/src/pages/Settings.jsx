import React, { useState, useEffect } from "react";
import {
    useGetConnectedAccountsQuery,
    useConnectAccountMutation,
    useDisconnectAccountMutation,
    useLazyGetYouTubeAuthUrlQuery,
    useLazyGetLinkedInAuthUrlQuery,
    useLazyGetXAuthUrlQuery,
    useLazyGetFacebookAuthUrlQuery,
} from "../features/socialAccounts/socialAccountsApi";
import {
    useGetGroupsQuery,
    useCreateGroupMutation,
    useUpdateGroupMutation,
    useAssignAccountToGroupMutation,
    useDeleteGroupMutation,
} from "../features/accountGroups/accountGroupsApi";
import {
    Plus,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FolderPlus,
    Tag,
    Share2,
    MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

import PlatformIcon from "../components/common/PlatformIcon";
import AccountGroupCard from "../components/accounts/AccountGroupCard";
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";

const AccountCard = ({ account, groups, onDisconnect, onAssign }) => {
    const getPlatformColor = (platform) => {
        switch (platform.toLowerCase()) {
            case 'facebook': return 'bg-blue-600';
            case 'instagram': return 'bg-pink-600';
            case 'linkedin': return 'bg-blue-700';
            case 'twitter': case 'x': return 'bg-black dark:bg-gray-800';
            case 'youtube': return 'bg-red-600';
            default: return 'bg-gray-500';
        }
    };

    return (
        <Card className="overflow-hidden border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 group relative">
            <div className={`h-2 ${getPlatformColor(account.platform)} w-full`} />
            
            <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/50 dark:bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Move to Group</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAssign(account._id, "none")}>
                            <Tag className="mr-2 h-4 w-4" />
                            Ungrouped
                        </DropdownMenuItem>
                        {groups?.map((g) => (
                            <DropdownMenuItem key={g._id} onClick={() => onAssign(account._id, g._id)}>
                                <Share2 className="mr-2 h-4 w-4" />
                                {g.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800`}>
                            <PlatformIcon platform={account.platform} className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg capitalize text-gray-900 dark:text-gray-100">{account.platform}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs text-green-600 font-medium">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-gray-900 shadow-sm border border-gray-100 overflow-hidden text-center">
                            <img
                                src={account.metadata?.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.platformUserName || account.platform)}&background=random&color=fff`}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                                {account.platformUserName || "Linked Account"}
                            </span>
                            <span className="text-[10px] text-gray-500">
                                ID: {account.platformUserId ? `${account.platformUserId.substring(0, 8)}...` : 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="bg-gray-50/50 dark:bg-gray-900/50 p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => onDisconnect(account)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disconnect
                </Button>
            </CardFooter>
        </Card>
    );
};

const Settings = () => {
    const { data: accounts, isLoading: isAccountsLoading } = useGetConnectedAccountsQuery();
    const { data: groups, isLoading: isGroupsLoading } = useGetGroupsQuery();
    
    const [connectAccount, { isLoading: isConnecting }] = useConnectAccountMutation();
    const [disconnectAccount, { isLoading: isDisconnecting }] = useDisconnectAccountMutation();
    
    // Group Mutations
    const [createGroup, { isLoading: isCreatingGroup }] = useCreateGroupMutation();
    const [updateGroup, { isLoading: isUpdatingGroup }] = useUpdateGroupMutation();
    const [deleteGroup] = useDeleteGroupMutation();
    const [assignAccount] = useAssignAccountToGroupMutation();

    const [searchParams, setSearchParams] = useSearchParams();
    const [getYouTubeAuthUrl, { isFetching: isFetchingYouTube }] = useLazyGetYouTubeAuthUrlQuery();
    const [getLinkedInAuthUrl, { isFetching: isFetchingLinkedIn }] = useLazyGetLinkedInAuthUrlQuery();
    const [getXAuthUrl, { isFetching: isFetchingX }] = useLazyGetXAuthUrlQuery();
    const [getFacebookAuthUrl, { isFetching: isFetchingFacebook }] = useLazyGetFacebookAuthUrlQuery();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [showPageSelect, setShowPageSelect] = useState(false);
    const [availablePages, setAvailablePages] = useState([]);
    const [tempToken, setTempToken] = useState("");

    const [groupFormData, setGroupFormData] = useState({
        name: "",
        description: "",
    });

    const [formData, setFormData] = useState({
        platform: "instagram",
        accessToken: "",
        platformUserId: "",
        platformUserName: "",
    });

    const handleGroupSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingGroup) {
                await updateGroup({ groupId: editingGroup._id, ...groupFormData }).unwrap();
                toast.success("Group updated successfully");
            } else {
                await createGroup(groupFormData).unwrap();
                toast.success("Account group created");
            }
            setIsGroupModalOpen(false);
            setEditingGroup(null);
            setGroupFormData({ name: "", description: "" });
        } catch (error) {
            toast.error(error?.data?.message || "Failed to save group");
        }
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setGroupFormData({ name: group.name, description: group.description || "" });
        setIsGroupModalOpen(true);
    };

    const handleDeleteGroup = async (groupId) => {
        if (window.confirm("Are you sure you want to delete this group? Accounts will not be deleted.")) {
            try {
                await deleteGroup(groupId).unwrap();
                toast.success("Group deleted");
            } catch (error) {
                toast.error("Failed to delete group");
            }
        }
    };

    const handleAssignToGroup = async (accountId, groupId) => {
        try {
            await assignAccount({ accountId, groupId }).unwrap();
            toast.success("Account moved successfully");
        } catch (error) {
            toast.error("Failed to move account");
        }
    };

    useEffect(() => {
        const platform = searchParams.get("platform");
        const status = searchParams.get("status");

        if (platform === "youtube" && status === "success") {
            toast.success("YouTube account connected successfully!");
            setSearchParams({}, { replace: true });
        } else if (platform === "x") {
            if (status === "success") {
                toast.success("X (Twitter) account connected successfully!");
                setSearchParams({}, { replace: true });
            } else if (status === "error") {
                toast.error(`Failed to connect X account: ${searchParams.get("message")}`);
                setSearchParams({}, { replace: true });
            }
        } else if (platform === "facebook" || platform === "linkedin") {
            if (status === "success") {
                toast.success("Account connected successfully!");
                setSearchParams({}, { replace: true });
            } else if (status === "select") {
                const accountsJson = searchParams.get("accounts") || searchParams.get("pages");
                const token = searchParams.get("token");
                if (accountsJson && token) {
                    try {
                        const accounts = JSON.parse(decodeURIComponent(accountsJson));
                        setAvailablePages(accounts);
                        setTempToken(token);
                        setShowPageSelect(true);
                    } catch (e) {
                        console.error("Failed to parse accounts:", e);
                    }
                }
            } else if (status === "error") {
                toast.error(`Failed to connect: ${searchParams.get("message")}`);
                setSearchParams({}, { replace: true });
            }
        }
    }, [searchParams, setSearchParams]);

    const handleConnect = async (e) => {
        e.preventDefault();

        if (formData.platform === "youtube") {
            try {
                const response = await getYouTubeAuthUrl().unwrap();
                if (response.data?.url) {
                    window.location.href = response.data.url;
                } else {
                    toast.error("Failed to generate YouTube authentication URL");
                }
                return;
            } catch (error) {
                console.error("Failed to get YouTube auth URL:", error);
                toast.error("Failed to initiate YouTube authentication");
                return;
            }
        }

        if (formData.platform === "linkedin") {
            try {
                const response = await getLinkedInAuthUrl().unwrap();
                if (response.data?.url) {
                    window.location.href = response.data.url;
                } else {
                    toast.error("Failed to generate LinkedIn authentication URL");
                }
                return;
            } catch (error) {
                console.error("Failed to get LinkedIn auth URL:", error);
                toast.error("Failed to initiate LinkedIn authentication");
                return;
            }
        }

        if (formData.platform === "x") {
            try {
                const response = await getXAuthUrl().unwrap();
                if (response.data?.url) {
                    window.location.href = response.data.url;
                } else {
                    toast.error("Failed to generate X authentication URL");
                }
                return;
            } catch (error) {
                console.error("Failed to get X auth URL:", error);
                toast.error("Failed to initiate X authentication");
                return;
            }
        }

        if (formData.platform === "facebook" || formData.platform === "instagram") {
            try {
                const response = await getFacebookAuthUrl().unwrap();
                if (response.data?.url) {
                    window.location.href = response.data.url;
                } else {
                    toast.error("Failed to generate Meta authentication URL");
                }
                return;
            } catch (error) {
                console.error("Failed to get Meta auth URL:", error);
                toast.error("Failed to initiate Meta authentication");
                return;
            }
        }

        try {
            await connectAccount(formData).unwrap();
            setIsModalOpen(false);
            setFormData({
                platform: "instagram",
                accessToken: "",
                platformUserId: "",
                platformUserName: "",
            });
            toast.success("Account connected successfully");
        } catch (error) {
            console.error("Failed to connect account:", error);
            toast.error(error?.data?.message || "Failed to connect account");
        }
    };

    const handleAccountSelection = async (account) => {
        try {
            await connectAccount({
                platform: account.platform || "linkedin",
                accessToken: tempToken,
                platformUserId: account.id,
                platformUserName: account.name || account.username,
                metadata: {
                    thumbnail: account.thumbnail,
                    username: account.username,
                    isPage: account.isPage, // Use the real isPage flag from the discovery list
                }
            }).unwrap();
            setShowPageSelect(false);
            setSearchParams({}, { replace: true });
            toast.success(`Connected as ${account.name || account.username}`);
        } catch (error) {
            toast.error("Failed to connect selected account");
        }
    };

    const handleDisconnect = async (account) => {
        const platformLabel = account.platformUserName || account.platform;
        if (window.confirm(`Are you sure you want to disconnect ${platformLabel}?`)) {
            try {
                await disconnectAccount(account._id).unwrap();
                toast.success(`${platformLabel} disconnected`);
            } catch (error) {
                console.error("Failed to disconnect account:", error);
                toast.error("Failed to disconnect account");
            }
        }
    };

    const handlePlatformChange = (value) => {
        setFormData({ ...formData, platform: value });
    };

    const getPlatformColor = (platform) => {
        switch (platform.toLowerCase()) {
            case 'facebook': return 'bg-blue-600';
            case 'instagram': return 'bg-pink-600';
            case 'linkedin': return 'bg-blue-700';
            case 'twitter': case 'x': return 'bg-black dark:bg-gray-800';
            case 'youtube': return 'bg-red-600';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Social Accounts</h1>
                    <p className="text-muted-foreground mt-1">
                        Organize your accounts by company and manage connections.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            setEditingGroup(null);
                            setGroupFormData({ name: "", description: "" });
                            setIsGroupModalOpen(true);
                        }}
                        className="hidden sm:flex"
                    >
                        <FolderPlus className="mr-2 h-4 w-4 text-primary" />
                        New Group
                    </Button>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                            <Plus className="mr-2 h-4 w-4" />
                            Connect Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Connect New Account</DialogTitle>
                            <DialogDescription>
                                {["youtube", "linkedin", "x", "facebook", "instagram"].includes(formData.platform)
                                    ? `Connect your ${formData.platform} account securely.`
                                    : "Enter your access token and details manually."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleConnect} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="platform">Platform</Label>
                                <Select
                                    value={formData.platform}
                                    onValueChange={handlePlatformChange}
                                >
                                    <SelectTrigger id="platform">
                                        <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="facebook">Facebook</SelectItem>
                                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                                        <SelectItem value="x">X (Twitter)</SelectItem>
                                        <SelectItem value="youtube">YouTube</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {!["youtube", "linkedin", "x", "facebook", "instagram"].includes(formData.platform) ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="accessToken">Access Token</Label>
                                        <Input
                                            id="accessToken"
                                            value={formData.accessToken}
                                            onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                            required
                                            placeholder="Enter access token"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="userId">User ID (Optional)</Label>
                                        <Input
                                            id="userId"
                                            value={formData.platformUserId}
                                            onChange={(e) => setFormData({ ...formData, platformUserId: e.target.value })}
                                            placeholder="Platform User ID"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="username">Username (Optional)</Label>
                                        <Input
                                            id="username"
                                            value={formData.platformUserName}
                                            onChange={(e) => setFormData({ ...formData, platformUserName: e.target.value })}
                                            placeholder="Display Name"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        You will be redirected securely to authorize account access.
                                    </p>
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={isConnecting || isFetchingYouTube || isFetchingLinkedIn || isFetchingX || isFetchingFacebook}>
                                    {(isConnecting || isFetchingYouTube || isFetchingLinkedIn || isFetchingX || isFetchingFacebook) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {["youtube", "linkedin", "x", "facebook", "instagram"].includes(formData.platform) ? `Connect via ${formData.platform === "youtube" ? "Google" : formData.platform === "facebook" || formData.platform === "instagram" ? "Meta" : formData.platform === "x" ? "X" : "LinkedIn"}` : "Connect"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Account Group Creation Modal */}
                <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingGroup ? "Edit Group" : "Create Account Group"}</DialogTitle>
                            <DialogDescription>
                                Create a label like "10Sight" or "Google" to group all related accounts together.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleGroupSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="groupName">Group Name (e.g., Company Name)</Label>
                                <Input
                                    id="groupName"
                                    value={groupFormData.name}
                                    onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                                    required
                                    placeholder="Enter company or brand name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="groupDesc">Description (Optional)</Label>
                                <Textarea
                                    id="groupDesc"
                                    value={groupFormData.description}
                                    onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                                    placeholder="Brief description for this group"
                                    className="resize-none"
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isCreatingGroup || isUpdatingGroup}>
                                    {(isCreatingGroup || isUpdatingGroup) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingGroup ? "Update Group" : "Create Group"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        <div className="space-y-12">
                {(isAccountsLoading || isGroupsLoading) ? (
                    <div className="col-span-full flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* 1. Render Grouped Accounts */}
                        {groups?.data?.map((group) => (
                            <AccountGroupCard
                                key={group._id}
                                group={group}
                                onEdit={handleEditGroup}
                                onDelete={handleDeleteGroup}
                                isEmpty={!group.accounts || group.accounts.length === 0}
                            >
                                {group.accounts?.map((account) => (
                                    <AccountCard 
                                        key={account._id} 
                                        account={account} 
                                        groups={groups.data}
                                        onDisconnect={handleDisconnect}
                                        onAssign={handleAssignToGroup}
                                    />
                                ))}
                            </AccountGroupCard>
                        ))}

                        {/* 2. Render Ungrouped Accounts */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b pb-4 border-gray-100 dark:border-gray-800">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                                    <Tag className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ungrouped Accounts</h2>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {accounts?.data?.filter(acc => !groups?.data?.some(g => g.accounts.some(ga => ga._id === acc._id))).length > 0 ? (
                                    accounts.data
                                        .filter(acc => !groups?.data?.some(g => g.accounts.some(ga => ga._id === acc._id)))
                                        .map((account) => (
                                            <AccountCard 
                                                key={account._id} 
                                                account={account} 
                                                groups={groups?.data || []}
                                                onDisconnect={handleDisconnect}
                                                onAssign={handleAssignToGroup}
                                            />
                                        ))
                                ) : (
                                    <div className="col-span-full border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/20">
                                        <p className="text-gray-500 italic">All accounts are organized.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* LinkedIn Page Selection Modal */}
            <Dialog open={showPageSelect} onOpenChange={setShowPageSelect}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Select Social Account</DialogTitle>
                        <DialogDescription>
                            We found multiple accounts managed by you. Please select which one you'd like to use for auto-posting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                        {availablePages.map((acc) => (
                            <div
                                key={acc.id}
                                className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer border-gray-200 dark:border-gray-800 transition-colors group"
                                onClick={() => handleAccountSelection(acc)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800">
                                        <div className="absolute top-0 right-0 p-1 bg-white dark:bg-gray-800 rounded-bl-lg">
                                             <PlatformIcon platform={acc.platform} className="h-3 w-3" />
                                        </div>
                                        <img
                                            src={acc.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name || acc.username)}&background=random&color=fff`}
                                            alt={acc.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{acc.name || acc.username}</span>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                                            {acc.isPage ? "Company Page" : "Personal Profile"}
                                        </span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                    Select
                                </Button>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPageSelect(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Settings;
