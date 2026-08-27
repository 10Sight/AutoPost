import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    useGetOrganizationQuery,
    useUpdateOrganizationMutation,
    useCreateStripeCheckoutMutation,
    useGetAiKeysQuery,
    useUpdateAiKeysMutation,
    useLazyGetGeminiOAuthUrlQuery,
    useDisconnectGeminiOAuthMutation,
    useUpdateGeminiProjectIdMutation,
} from "../redux/slices/organizationApiSlice";
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
    Clock,
    Sparkles,
    KeyRound,
    X,
    Chrome,
    ExternalLink,
    Unlink,
    ShieldQuestion,
} from "lucide-react";
import { toast } from "sonner";
import BillingSettings from "./BillingSettings";
import Pricing from "./Pricing";

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

const AI_PROVIDERS = [
    { field: "gemini", label: "Google Gemini (manual key)", hint: "Fallback for Gemini 2.5 Flash if you don't connect a Google account above.", console: null },
    { field: "openai", label: "OpenAI", hint: "Used for GPT-5 Mini text and DALL-E 3 image generation.", console: "https://platform.openai.com/api-keys" },
    { field: "anthropic", label: "Anthropic", hint: "Used for the Claude Sonnet 5 text model.", console: "https://console.anthropic.com/settings/keys" },
    { field: "runway", label: "Runway", hint: "Used for real AI video generation. Without this, video requests fall back to matched stock clips.", console: "https://dev.runwayml.com/" },
];

// Keys are write-only from the client's perspective — the API only ever returns
// booleans (configured or not), never the value. Each field saves/clears independently.
const AiKeyField = ({ field, label, hint, console: consoleUrl, configured, onSave, onClear, isSaving }) => {
    const [value, setValue] = useState("");

    const handleSave = () => {
        if (!value.trim()) return;
        onSave(field, value.trim());
        setValue("");
    };

    return (
        <div className="grid gap-2 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 sm:grid-cols-[200px_1fr] sm:items-start sm:gap-4">
            <div>
                <div className="flex items-center gap-2">
                    <Label className="font-medium">{label}</Label>
                    {configured ? (
                        <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Check className="h-3 w-3 mr-1" /> Configured
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Not set</Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                {consoleUrl && (
                    <a
                        href={consoleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline mt-1.5"
                    >
                        Get your key <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>
            <div className="flex gap-2">
                <Input
                    type="password"
                    autoComplete="off"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={configured ? "•••• Replace existing key" : "Paste API key"}
                    className="font-mono text-sm"
                />
                <Button type="button" size="sm" variant="outline" disabled={!value.trim() || isSaving} onClick={handleSave}>
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                </Button>
                {configured && (
                    <Button type="button" size="sm" variant="ghost" disabled={isSaving} onClick={() => onClear(field)} className="text-muted-foreground hover:text-red-600">
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
};

// "Connect Google Account" card for Gemini — a rotating OAuth access token instead
// of a static pasted key. Google still requires calls to be billed against a GCP
// project (the `x-goog-user-project` header), so a project id is a required second
// step after consent, not optional polish — the card explains that plainly rather
// than pretending this is fully zero-setup.
const GeminiOAuthCard = ({ geminiOAuth }) => {
    const [getAuthUrl, { isFetching: isConnecting }] = useLazyGetGeminiOAuthUrlQuery();
    const [disconnectOAuth, { isLoading: isDisconnecting }] = useDisconnectGeminiOAuthMutation();
    const [updateProjectId, { isLoading: isSavingProject }] = useUpdateGeminiProjectIdMutation();

    // Lazy-initialized only: this card only ever mounts after `getAiKeys` has
    // already resolved (see the aiKeysLoading gate below), and the "Connect"
    // button navigates away to Google and back via a full page redirect, so a
    // fresh mount — not an effect — is what picks up a newly-connected project id.
    const [projectId, setProjectId] = useState(geminiOAuth?.projectId || "");

    const handleConnect = async () => {
        try {
            const response = await getAuthUrl().unwrap();
            window.location.href = response.data.url;
        } catch (error) {
            toast.error(error?.data?.message || "Failed to start the Google connection");
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnectOAuth().unwrap();
            toast.success("Google account disconnected");
        } catch (error) {
            toast.error(error?.data?.message || "Failed to disconnect Google account");
        }
    };

    const handleSaveProjectId = async () => {
        try {
            await updateProjectId(projectId.trim()).unwrap();
            toast.success("Google Cloud project id saved");
        } catch (error) {
            toast.error(error?.data?.message || "Failed to save project id");
        }
    };

    const isConnected = Boolean(geminiOAuth?.connected);

    return (
        <div className="rounded-xl border border-violet-200 dark:border-violet-900/60 bg-gradient-to-br from-violet-50 to-indigo-50/40 dark:from-violet-950/20 dark:to-indigo-950/10 p-5 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
                        <Chrome className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">Google Gemini — Connect Account</p>
                            {isConnected ? (
                                <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <Check className="h-3 w-3 mr-1" /> Connected
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">Not connected</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md">
                            {isConnected
                                ? `Connected as ${geminiOAuth.connectedEmail || "your Google account"}${geminiOAuth.connectedAt ? ` on ${new Date(geminiOAuth.connectedAt).toLocaleDateString()}` : ""}. Access tokens rotate automatically — no key to copy or expire.`
                                : "Skip pasting an API key: sign in with Google and we handle token rotation for you. Recommended over the manual key below."}
                        </p>
                    </div>
                </div>

                {isConnected ? (
                    <Button type="button" size="sm" variant="outline" disabled={isDisconnecting} onClick={handleDisconnect} className="text-muted-foreground hover:text-red-600">
                        {isDisconnecting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5 mr-1.5" />}
                        Disconnect
                    </Button>
                ) : (
                    <Button type="button" size="sm" disabled={isConnecting} onClick={handleConnect} className="bg-violet-600 hover:bg-violet-700 text-white">
                        {isConnecting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Chrome className="h-3.5 w-3.5 mr-1.5" />}
                        Connect Google Account
                    </Button>
                )}
            </div>

            {isConnected && (
                <div className="mt-4 pt-4 border-t border-violet-200/60 dark:border-violet-900/40">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                        Google Cloud Project ID
                        <ShieldQuestion className="h-3.5 w-3.5 text-muted-foreground" />
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1 mb-2 max-w-xl">
                        Google bills OAuth-authenticated Gemini calls to a specific Google Cloud project (not your personal account).
                        Enter the project id that has the <span className="font-medium">Generative Language API</span> enabled and billing set up.
                    </p>
                    <div className="flex gap-2 max-w-md">
                        <Input
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            placeholder="my-gcp-project-id"
                            className="font-mono text-sm"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isSavingProject || projectId.trim() === (geminiOAuth?.projectId || "")}
                            onClick={handleSaveProjectId}
                        >
                            {isSavingProject ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                    {!geminiOAuth?.projectId && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                            Generation will fail until a project id is set — the connection alone isn't enough.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

const OrganizationSettings = () => {
    const { data: userData } = useGetCurrentUserQuery();
    const isAdmin = userData?.data?.role === "admin" || userData?.data?.role === "superadmin";

    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") || "general";

    const { data: orgData, isLoading: orgLoading } = useGetOrganizationQuery(undefined, { skip: !isAdmin });
    const { data: usageData } = useGetAccountUsageQuery(undefined, { skip: !isAdmin });
    const { data: aiKeysData, isLoading: aiKeysLoading } = useGetAiKeysQuery(undefined, { skip: !isAdmin });
    const [updateOrganization, { isLoading: isUpdating }] = useUpdateOrganizationMutation();
    const [createStripeCheckout, { isLoading: isCreatingStripe }] = useCreateStripeCheckoutMutation();
    const [updateAiKeys, { isLoading: isSavingAiKeys }] = useUpdateAiKeysMutation();

    const organization = orgData?.data;
    const aiKeys = aiKeysData?.data || {};
    const geminiOAuth = aiKeys.geminiOAuth;

    const usage = usageData?.data?.usage;

    // Surface the result of the "Connect Google Account" redirect (see
    // oauth.controller.js) and strip the transient query params afterward so a
    // page refresh doesn't re-show the same toast.
    useEffect(() => {
        const oauthResult = searchParams.get("oauth");
        if (!oauthResult) return;

        if (oauthResult === "success") {
            toast.success("Google account connected");
        } else {
            const reason = searchParams.get("reason");
            const reasonMessages = {
                denied: "Google sign-in was cancelled or denied.",
                invalid_state: "The connection request expired or was invalid. Please try again.",
                no_refresh_token: "Google didn't return a renewable token. Try disconnecting any prior access at myaccount.google.com and reconnect.",
                exchange_failed: "Failed to complete the Google connection. Please try again.",
            };
            toast.error(reasonMessages[reason] || "Failed to connect Google account.");
        }

        const next = new URLSearchParams(searchParams);
        next.delete("oauth");
        next.delete("reason");
        setSearchParams(next, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleSaveAiKey = async (field, value) => {
        try {
            await updateAiKeys({ [field]: value }).unwrap();
            toast.success("API key saved");
        } catch (error) {
            toast.error(error?.data?.message || "Failed to save API key");
        }
    };

    const handleClearAiKey = async (field) => {
        try {
            await updateAiKeys({ [field]: "" }).unwrap();
            toast.success("API key removed");
        } catch (error) {
            toast.error(error?.data?.message || "Failed to remove API key");
        }
    };

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

            <Tabs value={initialTab} onValueChange={(tab) => setSearchParams({ tab })} className="w-full">
                <TabsList className="grid w-full max-w-xl grid-cols-4">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Branding
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> AI Keys
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

                <TabsContent value="ai" className="mt-6">
                    <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-violet-500" />
                                AI Provider Keys (BYOK)
                            </CardTitle>
                            <CardDescription>
                                Bring your own API keys for the AI Content Studio. Keys are encrypted at rest and never
                                sent back to the browser once saved — only whether each provider is configured.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {aiKeysLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div>
                                    <GeminiOAuthCard geminiOAuth={geminiOAuth} />
                                    {AI_PROVIDERS.map(({ field, label, hint, console: consoleUrl }) => (
                                        <AiKeyField
                                            key={field}
                                            field={field}
                                            label={label}
                                            hint={hint}
                                            console={consoleUrl}
                                            configured={Boolean(aiKeys[field])}
                                            onSave={handleSaveAiKey}
                                            onClear={handleClearAiKey}
                                            isSaving={isSavingAiKeys}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="mt-6 space-y-12">
                    <BillingSettings />
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-12">
                        <Pricing />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OrganizationSettings;
