import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { 
    useGetCurrentUserQuery, 
    useUpdateProfileMutation, 
    useChangePasswordMutation 
} from "../features/auth/authApi";
import { useUploadMediaMutation } from "../features/media/mediaApi";
import { 
    User, 
    Lock, 
    Shield, 
    Mail, 
    Camera, 
    Activity,
    Loader2, 
    CheckCircle2, 
    Building2,
    Clock,
    UserCircle,
    KeyRound,
    Sparkles,
    ArrowRight,
    Eye,
    EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { cn } from "../lib/utils";
import { format } from "date-fns";

const ProfileSettings = () => {
    const navigate = useNavigate();
    const { data: userData, isLoading: userLoading } = useGetCurrentUserQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
    const [uploadMedia, { isLoading: isUploading }] = useUploadMediaMutation();

    const user = userData?.data;

    const [profileForm, setProfileForm] = useState({
        name: "",
        email: "",
        avatar: ""
    });

    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || "",
                email: user.email || "",
                avatar: user.avatar || ""
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await uploadMedia(formData).unwrap();
            const avatarUrl = result.data.url;
            await updateProfile({ ...profileForm, avatar: avatarUrl }).unwrap();
            toast.success("Profile picture updated");
            setProfileForm(prev => ({ ...prev, avatar: avatarUrl }));
        } catch (err) {
            toast.error(err?.data?.message || "Failed to upload avatar");
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(profileForm).unwrap();
            toast.success("Profile updated successfully");
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update profile");
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return toast.error("New passwords do not match");
        }

        try {
            await changePassword({
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            }).unwrap();
            toast.success("Password changed successfully");
            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            toast.error(err?.data?.message || "Failed to change password");
        }
    };

    if (userLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-700">
            {/* Classy & Clean Header */}
            <div className="flex flex-col md:flex-row items-center gap-8 pb-10 border-b border-slate-100 dark:border-gray-800">
                <div className="relative group">
                    <Avatar className="h-24 w-24 md:h-28 md:w-28 border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 transition-transform duration-500 hover:scale-[1.02]">
                        <AvatarImage src={profileForm.avatar} className="object-cover" />
                        <AvatarFallback className="text-xl font-medium text-slate-400">
                            {user?.name?.split(' ').map(n => n[0]).join('') || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-400 rounded-full cursor-pointer shadow-sm border border-slate-200 dark:border-gray-700 hover:text-blue-600 transition-colors">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                    </label>
                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60 rounded-full backdrop-blur-[2px] z-10">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    )}
                </div>
                
                <div className="flex-1 space-y-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                        {user?.name || "Member Name"}
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                        {user?.role} • {user?.email}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList variant="line" className="mb-10">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="account">Workspace</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="focus-visible:outline-none">
                    <Card className="relative border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
                        {/* Decorative Background Shape */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-gray-800/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                        
                        <CardHeader className="p-8 pb-6 border-b border-slate-50 dark:border-gray-800/50 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Personal Details</CardTitle>
                                    <CardDescription className="text-sm">Manage your account information and preferences.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <UserCircle className="w-3.5 h-3.5" /> Display Name
                                    </Label>
                                    <Input 
                                        name="name"
                                        value={profileForm.name}
                                        onChange={handleProfileChange}
                                        className="h-11 bg-slate-50/50 dark:bg-gray-900 border-slate-200 dark:border-gray-800 rounded-lg text-sm font-medium transition-all focus:ring-1 focus:ring-slate-900 dark:focus:ring-white" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5" /> Email Address
                                    </Label>
                                    <Input 
                                        name="email"
                                        type="email"
                                        value={profileForm.email}
                                        onChange={handleProfileChange}
                                        className="h-11 bg-slate-50/50 dark:bg-gray-900 border-slate-200 dark:border-gray-800 rounded-lg text-sm font-medium transition-all focus:ring-1 focus:ring-slate-900 dark:focus:ring-white" 
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-8 bg-slate-50/30 dark:bg-gray-900/30 border-t border-slate-50 dark:border-gray-800/50 flex justify-end relative z-10">
                            <Button 
                                onClick={handleProfileSubmit}
                                disabled={isUpdating}
                                className="h-11 px-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-sm shadow-sm"
                            >
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Update Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="focus-visible:outline-none">
                    <Card className="relative border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
                        {/* Decorative Background Shape */}
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-50 dark:bg-rose-900/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

                        <CardHeader className="p-8 pb-6 border-b border-slate-50 dark:border-gray-800/50 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Password Security</CardTitle>
                                    <CardDescription className="text-sm">Update your password to keep your account secure.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 relative z-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <KeyRound className="w-3.5 h-3.5" /> Current Password
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                name="oldPassword"
                                                type={showOldPassword ? "text" : "password"}
                                                value={passwordForm.oldPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="••••••••••••"
                                                className="h-11 bg-slate-50/50 dark:bg-gray-900 border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-none pr-10" 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOldPassword(!showOldPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5" /> New Password
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                name="newPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                value={passwordForm.newPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="••••••••••••"
                                                className="h-11 bg-slate-50/50 dark:bg-gray-900 border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all pr-10" 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5" /> Confirm New Password
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={passwordForm.confirmPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="••••••••••••"
                                                className="h-11 bg-slate-50/50 dark:bg-gray-900 border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all pr-10" 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Animated Security Character */}
                                <div className="hidden lg:flex flex-col items-center justify-center p-6 relative select-none">
                                    <div className="relative w-64 h-64 flex items-center justify-center">
                                        {/* Aura Rings */}
                                        <div className="absolute inset-4 rounded-full border border-blue-500/10 animate-ping opacity-20" />
                                        <div className="absolute inset-10 rounded-full border border-blue-500/5 animate-pulse" />
                                        
                                        {/* The Security Bot Character */}
                                        <div className="relative animate-bounce duration-[4000ms] flex flex-col items-center">
                                            {/* Bot Head */}
                                            <div className="w-20 h-16 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl relative z-20 flex flex-col items-center justify-center gap-2 overflow-hidden">
                                                <div className="flex gap-3">
                                                    <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                                                    <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                                                </div>
                                                <div className="w-8 h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                                
                                                {/* Glass Reflection */}
                                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                                            </div>

                                            {/* Bot Body */}
                                            <div className="w-14 h-16 bg-slate-50 dark:bg-slate-900/80 -mt-2 rounded-2xl border-x-2 border-b-2 border-slate-100 dark:border-slate-800 shadow-lg relative flex items-center justify-center overflow-hidden">
                                                <Shield className="w-6 h-6 text-blue-100 dark:text-blue-900" />
                                                <div className="absolute inset-0 bg-blue-500/5 transition-colors group-hover:bg-blue-500/10" />
                                            </div>

                                            {/* Float Shadow */}
                                            <div className="w-16 h-4 bg-slate-200/30 dark:bg-slate-900/30 rounded-[100%] mt-8 blur-md transform scale-x-125 animate-pulse" />
                                        </div>

                                        {/* Floating Icons around him */}
                                        <div className="absolute top-10 left-10 w-8 h-8 rounded-lg bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
                                            <KeyRound className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div className="absolute bottom-16 right-8 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center animate-[float_4s_ease-in-out_infinite_1s]">
                                            <Lock className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 text-center">
                                        <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                                            Protective Shield Active
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Bot-Guard v2.4 secured</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-8 bg-slate-50/30 dark:bg-gray-900/30 border-t border-slate-50 dark:border-gray-800/50 flex justify-end relative z-10">
                            <Button 
                                onClick={handlePasswordSubmit}
                                disabled={isChangingPassword}
                                className="h-11 px-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-sm shadow-sm"
                            >
                                {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                                Change Password
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Account Details */}
                <TabsContent value="account" className="focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                        {/* Decorative Background Texture */}
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none -z-10" />

                        <div className="group p-8 rounded-2xl bg-white dark:bg-gray-950 border border-slate-100 dark:border-gray-800 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-500 hover:border-blue-200 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-110">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Organization Node</h4>
                                <p className="text-sm font-bold text-slate-900 dark:text-white font-mono break-all line-clamp-1">{user?.organizationId}</p>
                            </div>
                        </div>

                        <div className="group p-8 rounded-2xl bg-white dark:bg-gray-950 border border-slate-100 dark:border-gray-800 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-500 flex flex-col justify-between hover:border-emerald-200 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Member Since</h4>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {user?.createdAt ? format(new Date(user.createdAt), "MMMM dd, yyyy") : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Quick Link to Account Status - "Below the profile setting page" */}
            <div className="pt-8 border-t border-slate-100 dark:border-gray-800">
                <Card className="group relative border-none bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-500 cursor-pointer" onClick={() => navigate("/dashboard/account-status")}>
                    <CardContent className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Status & Usage</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-gray-400 max-w-sm">
                                    Monitor your organization credentials, system health, and real-time usage metrics.
                                </p>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-gray-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-300">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfileSettings;
