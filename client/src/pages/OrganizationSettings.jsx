import React, { useState, useEffect } from "react";
import { useGetOrganizationQuery, useUpdateOrganizationMutation, useCreateRazorpayOrderMutation, useVerifyRazorpayPaymentMutation, useCreateStripeCheckoutMutation } from "../redux/slices/organizationApiSlice";
import { useGetCurrentUserQuery } from "../features/auth/authApi";
import {
    Save,
    Loader2,
    Palette,
    Globe,
    Building2,
    Image as ImageIcon,
    Layout,
    CreditCard,
    Check,
    Zap,
    TrendingUp,
    ShieldCheck,
    ArrowUpRight,
    Clock
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
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

import { useGetAccountUsageQuery } from "../redux/slices/usageApiSlice";

const OrganizationSettings = () => {
    const { data: userData } = useGetCurrentUserQuery();
    const isAdmin = userData?.data?.role === "admin" || userData?.data?.role === "superadmin";

    const { data: orgData, isLoading: orgLoading } = useGetOrganizationQuery(undefined, { skip: !isAdmin });
    const { data: usageData } = useGetAccountUsageQuery(undefined, { skip: !isAdmin });
    const [updateOrganization, { isLoading: isUpdating }] = useUpdateOrganizationMutation();
    const [createOrder, { isLoading: isCreatingOrder }] = useCreateRazorpayOrderMutation();
    const [verifyPayment, { isLoading: isVerifying }] = useVerifyRazorpayPaymentMutation();
    const [createStripeCheckout, { isLoading: isCreatingStripe }] = useCreateStripeCheckoutMutation();

    const organization = orgData?.data;

    const usage = usageData?.data?.usage;

    const [form, setForm] = useState({
        name: "",
        branding: {
            logoUrl: "",
            primaryColor: "#2563eb",
            accentColor: "#4f46e5",
            backgroundColor: "#ffffff",
            faviconUrl: "",
        },
        customDomain: "",
    });

    useEffect(() => {
        if (orgData?.data) {
            const org = orgData.data;
            setForm({
                name: org.name || "",
                branding: {
                    logoUrl: org.branding?.logoUrl || "",
                    primaryColor: org.branding?.primaryColor || "#2563eb",
                    accentColor: org.branding?.accentColor || "#4f46e5",
                    backgroundColor: org.branding?.backgroundColor || "#ffffff",
                    faviconUrl: org.branding?.faviconUrl || "",
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

    const handleUpgrade = async (plan, gateway = 'razorpay') => {
        try {
            if (gateway === 'stripe') {
                const result = await createStripeCheckout(plan).unwrap();
                if (result.data?.url) {
                    window.location.href = result.data.url;
                }
                return;
            }

            // Razorpay flow (Default)
            const orderData = await createOrder(plan).unwrap();
            const { orderId, amount, currency, keyId, orgName, userEmail, userName } = orderData.data;
            // ... (rest of razorpay logic remains same)

            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "10Sight Social",
                description: `Upgrade to ${plan.toUpperCase()} Plan`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: plan
                        }).unwrap();
                        toast.success(`Success! Your workspace is now on the ${plan} plan.`);
                    } catch (err) {
                        toast.error("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: userName,
                    email: userEmail,
                },
                notes: {
                    organization: orgName
                },
                theme: {
                    color: "#2563eb",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to initiate upgrade");
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
                                                name="branding.logoUrl"
                                                value={form.branding.logoUrl}
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
                                                    <Label htmlFor="backgroundColor" className="text-xs text-muted-foreground">Background Color</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="color"
                                                            id="backgroundColor"
                                                            name="branding.backgroundColor"
                                                            value={form.branding.backgroundColor}
                                                            onChange={handleChange}
                                                            className="w-10 h-10 p-1 cursor-pointer"
                                                        />
                                                        <Input
                                                            value={form.branding.backgroundColor}
                                                            onChange={handleChange}
                                                            name="branding.backgroundColor"
                                                            className="flex-1 font-mono uppercase"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Preview</Label>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm transition-colors" style={{ backgroundColor: form.branding.backgroundColor }}>
                                            <div className="h-10 border-b border-gray-200 dark:border-gray-800 bg-gray-50/10 backdrop-blur-sm flex items-center px-4">
                                                <div className="flex gap-1.5">
                                                    <div className="size-2.5 rounded-full bg-red-400" />
                                                    <div className="size-2.5 rounded-full bg-yellow-400" />
                                                    <div className="size-2.5 rounded-full bg-green-400" />
                                                </div>
                                                <div className="mx-auto text-[10px] text-gray-400 font-mono">{form.customDomain || 'demo.autopost.com'}</div>
                                            </div>
                                            <div className="p-6 flex flex-col items-center gap-6">
                                                {form.branding.logoUrl ? (
                                                    <img src={form.branding.logoUrl} alt="Logo Preview" className="h-12 w-auto object-contain" />
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
                    <div className="space-y-8">
                        {/* Current Plan Overview - Professional */}
                        <div className="pro-card p-6 rounded-2xl">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md px-3 py-0.5 text-[10px] font-bold">
                                            {organization?.billing?.subscriptionStatus?.toUpperCase() || 'ACTIVE'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Subscription</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {organization?.billing?.plan?.charAt(0).toUpperCase() + organization?.billing?.plan?.slice(1) || 'Free'} Plan
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {organization?.billing?.plan === 'free' 
                                            ? 'You are currently using our free tier with limited resources.' 
                                            : `Professional features active for ${organization?.name}.`}
                                    </p>
                                </div>

                                <div className="text-left md:text-right">
                                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-tight">Monthly Billing</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                        {organization?.billing?.plan === 'free' ? '$0.00' : '$29.00'}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                                    </div>
                                    <div className="mt-2 text-[11px] text-slate-500 flex items-center md:justify-end gap-1">
                                        <ShieldCheck className="h-3 w-3" /> 
                                        {organization?.billing?.subscriptionStatus === 'active' ? 'Secure Payment Verified' : 'Managed Account'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Usage Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { 
                                    label: "Post Credits", 
                                    current: usage?.postsCount || 0, 
                                    limit: usage?.postsLimit || 0, 
                                    icon: TrendingUp
                                },
                                { 
                                    label: "Social Accounts", 
                                    current: usage?.platformsCount || 0, 
                                    limit: usage?.platformsLimit || 0, 
                                    icon: Globe
                                },
                                { 
                                    label: "Cloud Storage", 
                                    current: ((usage?.storageUsedBytes || 0) / (1024 * 1024)).toFixed(1), 
                                    limit: ((usage?.storageLimitBytes || 1024 * 1024 * 1024) / (1024 * 1024)).toFixed(1), 
                                    unit: "MB",
                                    icon: ImageIcon
                                }
                            ].map((metric, i) => (
                                <div key={i} className="pro-card p-5 rounded-xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                            <metric.icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usage</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">{metric.label}</h4>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{metric.current}</span>
                                        <span className="text-xs text-slate-400 font-medium">
                                            {metric.unit ? metric.unit : ''} / {metric.limit}{metric.unit ? 'MB' : ''}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-900 dark:bg-white transition-all duration-700"
                                            style={{ 
                                                width: `${Math.min((Number(metric.current) / Number(metric.limit)) * 100 || 0, 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Clean Pricing Table */}
                        <div className="pt-4">
                            <div className="mb-10">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Plans</h3>
                                <p className="text-sm text-slate-500">Choose the plan that fits your team's scale.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
                                {/* Starter Plan */}
                                <div className="pro-card p-6 rounded-2xl flex flex-col">
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Starter</h4>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-slate-900 dark:text-white">$0</span>
                                            <span className="text-sm text-slate-400">/mo</span>
                                        </div>
                                    </div>
                                    
                                    <ul className="space-y-3 flex-1 mb-8">
                                        {[
                                            "100 Post Credits / mo",
                                            "5 Social Accounts",
                                            "1GB Media Storage",
                                            "Basic Analytics"
                                        ].map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Check className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button variant="outline" className="w-full rounded-lg font-bold border-slate-200 dark:border-slate-800" disabled={organization?.billing?.plan === 'free'}>
                                        {organization?.billing?.plan === 'free' ? 'Current Plan' : 'Select Starter'}
                                    </Button>
                                </div>

                                {/* Pro Plan */}
                                <div className="pro-card p-6 rounded-2xl border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white flex flex-col shadow-lg">
                                    <div className="mb-6">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Professional</h4>
                                            <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold">POPULAR</Badge>
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-slate-900 dark:text-white">$29</span>
                                            <span className="text-sm text-slate-400">/mo</span>
                                        </div>
                                    </div>
                                    
                                    <ul className="space-y-3 flex-1 mb-8">
                                        {[
                                            "Unlimited Post Credits",
                                            "Unlimited Social Accounts",
                                            "50GB Media Storage",
                                            "Advanced AI Suggestions",
                                            "Priority 24/7 Support",
                                            "White-label Branding"
                                        ].map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-200 font-medium">
                                                <Check className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex flex-col gap-2">
                                        <Button 
                                            className="w-full rounded-lg font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900"
                                            onClick={() => handleUpgrade('pro', 'razorpay')}
                                            disabled={isCreatingOrder || isVerifying || isCreatingStripe || organization?.billing?.plan === 'pro'}
                                        >
                                            {(isCreatingOrder || isVerifying) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                                            Pay with Razorpay
                                        </Button>
                                        
                                        <Button 
                                            variant="outline" 
                                            className="w-full rounded-lg font-bold border-slate-200 dark:border-slate-800"
                                            onClick={() => handleUpgrade('pro', 'stripe')}
                                            disabled={isCreatingOrder || isVerifying || isCreatingStripe || organization?.billing?.plan === 'pro'}
                                        >
                                            {isCreatingStripe ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
                                            Pay with Stripe
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="pro-card p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="text-xs text-slate-500 font-medium">
                                    Next billing: {organization?.billing?.currentPeriodEnd 
                                        ? new Date(organization.billing.currentPeriodEnd).toLocaleDateString() 
                                        : "N/A"}
                                </span>
                            </div>
                            <Button variant="ghost" className="text-xs font-bold text-slate-500 hover:text-slate-900" disabled={!organization?.billing?.stripeSubscriptionId}>
                                Download Invoice
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OrganizationSettings;
