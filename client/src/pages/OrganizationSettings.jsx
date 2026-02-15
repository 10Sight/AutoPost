import React, { useState, useEffect } from "react";
import { useGetOrganizationQuery, useUpdateOrganizationMutation } from "../redux/slices/organizationApiSlice";
import { useGetCurrentUserQuery } from "../features/auth/authApi";
import {
    Save,
    Loader2,
    Palette,
    Globe,
    Building2,
    Image as ImageIcon,
    Layout,
    CreditCard
} from "lucide-react";
import { toast } from "sonner";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const OrganizationSettings = () => {
    const { data: orgData, isLoading: orgLoading } = useGetOrganizationQuery();
    const { data: userData } = useGetCurrentUserQuery();
    const [updateOrganization, { isLoading: isUpdating }] = useUpdateOrganizationMutation();

    const [form, setForm] = useState({
        name: "",
        branding: {
            logo: "",
            primaryColor: "#2563eb",
            accentColor: "#4f46e5",
            favicon: "",
        },
        customDomain: "",
    });

    useEffect(() => {
        if (orgData?.data) {
            const org = orgData.data;
            setForm({
                name: org.name || "",
                branding: {
                    logo: org.branding?.logo || "",
                    primaryColor: org.branding?.primaryColor || "#2563eb",
                    accentColor: org.branding?.accentColor || "#4f46e5",
                    favicon: org.branding?.favicon || "",
                },
                customDomain: org.customDomain || "",
            });
        }
    }, [orgData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("branding.")) {
            const field = name.split(".")[1];
            setForm(prev => ({
                ...prev,
                branding: { ...prev.branding, [field]: value }
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateOrganization(form).unwrap();
            toast.success("Organization settings updated successfully");
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update settings");
        }
    };

    if (orgLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isAdmin = userData?.data?.role === "admin";

    if (!isAdmin) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center p-4">
                <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-gray-500 mt-2">Only organization administrators can modify these settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-[1200px] mx-auto overflow-x-hidden">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Organization Settings</h1>
                <p className="text-muted-foreground">
                    Manage your organization's identity, branding, and white-labeling preferences.
                </p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Branding
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Billing
                    </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit}>
                    <TabsContent value="general" className="mt-6">
                        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                            <CardHeader>
                                <CardTitle>Company Details</CardTitle>
                                <CardDescription>Basic information about your organization.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Organization Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Enter organization name"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customDomain">Custom Domain (White-Label)</Label>
                                    <div className="flex gap-2">
                                        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 px-3 rounded-l-md border border-r-0 border-gray-200 dark:border-gray-700">
                                            <Globe className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <Input
                                            id="customDomain"
                                            name="customDomain"
                                            value={form.customDomain}
                                            onChange={handleChange}
                                            className="rounded-l-none"
                                            placeholder="app.yourdomain.com"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Point your CNAME record to `autopost.yourserver.com` to enable white-labeling.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 p-6">
                                <Button type="submit" disabled={isUpdating} className="ml-auto">
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="branding" className="mt-6">
                        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                            <CardHeader>
                                <CardTitle>Visual Identity</CardTitle>
                                <CardDescription>Customize the look and feel of your portal.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="logo">Logo URL</Label>
                                            <Input
                                                id="logo"
                                                name="branding.logo"
                                                value={form.branding.logo}
                                                onChange={handleChange}
                                                placeholder="https://example.com/logo.png"
                                            />
                                        </div>
                                        <div className="grid gap-4 pt-2">
                                            <Label>Theme Colors</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="primaryColor" className="text-xs text-muted-foreground">Primary Color</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="color"
                                                            id="primaryColor"
                                                            name="branding.primaryColor"
                                                            value={form.branding.primaryColor}
                                                            onChange={handleChange}
                                                            className="w-10 h-10 p-1 cursor-pointer"
                                                        />
                                                        <Input
                                                            value={form.branding.primaryColor}
                                                            onChange={handleChange}
                                                            name="branding.primaryColor"
                                                            className="flex-1 font-mono uppercase"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="accentColor" className="text-xs text-muted-foreground">Accent Color</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="color"
                                                            id="accentColor"
                                                            name="branding.accentColor"
                                                            value={form.branding.accentColor}
                                                            onChange={handleChange}
                                                            className="w-10 h-10 p-1 cursor-pointer"
                                                        />
                                                        <Input
                                                            value={form.branding.accentColor}
                                                            onChange={handleChange}
                                                            name="branding.accentColor"
                                                            className="flex-1 font-mono uppercase"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Preview</Label>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-950">
                                            <div className="h-10 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center px-4">
                                                <div className="flex gap-1.5">
                                                    <div className="size-2.5 rounded-full bg-red-400" />
                                                    <div className="size-2.5 rounded-full bg-yellow-400" />
                                                    <div className="size-2.5 rounded-full bg-green-400" />
                                                </div>
                                                <div className="mx-auto text-[10px] text-gray-400 font-mono">{form.customDomain || 'demo.autopost.com'}</div>
                                            </div>
                                            <div className="p-6 flex flex-col items-center gap-6">
                                                {form.branding.logo ? (
                                                    <img src={form.branding.logo} alt="Logo Preview" className="h-12 w-auto object-contain" />
                                                ) : (
                                                    <span className="text-2xl font-bold tracking-tight" style={{ color: form.branding.primaryColor }}>
                                                        {form.name || "AutoPost"}
                                                    </span>
                                                )}

                                                <div className="w-full space-y-4">
                                                    <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-800 rounded mx-auto" />
                                                    <div className="h-8 w-1/2 rounded-lg mx-auto shadow-sm" style={{ backgroundColor: form.branding.primaryColor }} />
                                                    <div className="flex justify-center gap-2">
                                                        <div className="size-4 rounded-full" style={{ backgroundColor: form.branding.accentColor }} />
                                                        <div className="size-4 rounded-full bg-gray-200 dark:bg-gray-700" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 p-6">
                                <Button type="submit" disabled={isUpdating} className="ml-auto">
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Apply Branding
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </form>


                <TabsContent value="billing" className="mt-6">
                    <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                        <CardHeader>
                            <CardTitle>Subscription & Billing</CardTitle>
                            <CardDescription>Manage your plan, billing details, and invoices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Pro Plan</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-[10px] font-bold uppercase tracking-wider">Active</span>
                                    </div>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        You are currently on the Pro plan with 5,000 monthly posts.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                                    <div className="text-xs text-muted-foreground">Renews on Mar 1, 2026</div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <h4 className="text-sm font-medium">Payment Method</h4>
                                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-16 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                                            <span className="font-mono text-xs font-bold">VISA</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">Visa ending in 4242</div>
                                            <div className="text-xs text-muted-foreground">Expiry 12/2028</div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Update</Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 p-6 flex justify-between">
                            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">Cancel Subscription</Button>
                            <Button>Upgrade Plan</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OrganizationSettings;
