import React, { useState, useEffect } from "react";
import {
    useGetConnectedAccountsQuery,
    useConnectAccountMutation,
    useDisconnectAccountMutation,
    useLazyGetYouTubeAuthUrlQuery,
} from "../features/socialAccounts/socialAccountsApi";
import {
    Plus,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

import PlatformIcon from "../components/common/PlatformIcon";
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
import { Badge } from "../components/ui/badge";

const Settings = () => {
    const { data: accounts, isLoading } = useGetConnectedAccountsQuery();
    const [connectAccount, { isLoading: isConnecting }] = useConnectAccountMutation();
    const [disconnectAccount, { isLoading: isDisconnecting }] = useDisconnectAccountMutation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [getYouTubeAuthUrl, { isFetching: isFetchingUrl }] = useLazyGetYouTubeAuthUrlQuery();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        platform: "instagram",
        accessToken: "",
        platformUserId: "",
        platformUserName: "",
    });

    useEffect(() => {
        const platform = searchParams.get("platform");
        const status = searchParams.get("status");

        if (platform === "youtube" && status === "success") {
            toast.success("YouTube account connected successfully!");
            // Clean up search params
            setSearchParams({}, { replace: true });
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

    const handleDisconnect = async (platform) => {
        if (window.confirm(`Are you sure you want to disconnect ${platform}?`)) {
            try {
                await disconnectAccount(platform).unwrap();
                toast.success(`${platform} disconnected`);
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
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Connected Accounts</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your social media connections and integrations.
                    </p>
                </div>

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
                                {formData.platform === "youtube"
                                    ? "Connect your YouTube channel using Google OAuth."
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

                            {formData.platform !== "youtube" ? (
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
                                        You will be redirected to Google to securely authorize channel-level access.
                                    </p>
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={isConnecting || isFetchingUrl}>
                                    {(isConnecting || isFetchingUrl) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {formData.platform === "youtube" ? "Connect via Google" : "Connect"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {isLoading ? (
                    <div className="col-span-full flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : accounts?.data?.length > 0 ? (
                    accounts.data.map((account) => (
                        <Card key={account._id} className="overflow-hidden border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 group">
                            <div className={`h-2 ${getPlatformColor(account.platform)} w-full`} />

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
                                        <div className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-gray-900 shadow-sm border border-gray-100 overflow-hidden">
                                            <img
                                                src={account.metadata?.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.platformUserName || account.platform)}&background=random&color=fff`}
                                                alt="Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                                    onClick={() => handleDisconnect(account.platform)}
                                    disabled={isDisconnecting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Disconnect
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                            <AlertCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No accounts connected</h3>
                        <p className="text-gray-500 mt-2 max-w-md">
                            Connect your social media accounts to start scheduling and publishing your content automatically.
                        </p>
                        <Button className="mt-6" onClick={() => setIsModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Connect First Account
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
