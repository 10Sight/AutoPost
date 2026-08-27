import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Sparkles, Calendar, BarChart3, Users } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import PlatformHub from "./PlatformHub";

const AuthLayout = () => {
    return (
        <div className="flex h-screen w-full bg-white dark:bg-slate-950 overflow-hidden font-sans select-none">
            {/* Left Side: Visual/Branding Panel */}
            <div className="hidden lg:flex lg:w-[50%] relative bg-[#f7f8ff] dark:bg-slate-900 overflow-hidden flex-col">
                {/* Subtle Decorative Shapes */}
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#e0e7ff] dark:bg-blue-900/10 rounded-full blur-[100px] opacity-60" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#f3e8ff] dark:bg-purple-900/10 rounded-full blur-[80px] opacity-60" />

                {/* Logo Area - Compact */}
                <div className="pt-6 px-12 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-[#1e293b] dark:text-white tracking-tight">AutoPost</span>
                    </div>
                </div>

                {/* Main Content Area - Center Justified */}
                <div className="flex-1 flex flex-col justify-center px-16 relative z-10 overflow-hidden">
                    <div className="max-w-xl space-y-2 animate-geometric-reveal">
                        <div className="space-y-0.5">
                            <h1 className="text-[64px] font-bold text-[#1e293b] dark:text-white leading-[1.05] tracking-tight">
                                Post smarter,
                            </h1>
                            <h1 className="text-[64px] font-bold leading-[1.05] tracking-tight text-gradient-primary">
                                not harder.
                            </h1>
                        </div>
                        <p className="text-lg font-medium text-slate-400 dark:text-slate-500 max-w-md leading-relaxed">
                            Plan, schedule, and publish content across all your platforms in one place.
                        </p>

                        {/* Illustration - Multi-platform publishing hub */}
                        <div className="relative pt-2 px-2">
                            <PlatformHub />
                        </div>
                    </div>
                </div>

                {/* Bottom Features Showcase - Compact */}
                <div className="pb-8 pt-3 px-12 relative z-10">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-bold text-[#1e293b] dark:text-white">Smart Scheduling</h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">Auto-post at the best time for engagement</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-[#8b5cf6]" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-bold text-[#1e293b] dark:text-white">Analytics</h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">Track performance and grow your audience</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                                <Users className="w-5 h-5 text-[#6366f1]" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-bold text-[#1e293b] dark:text-white">Team Collaboration</h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">Work together and stay organized</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Forms */}
            <div className="flex-1 relative flex flex-col bg-white dark:bg-slate-950">
                {/* Header with Theme Toggle */}
                <header className="p-8 flex justify-end relative z-10">
                    <ThemeToggle showLabel />
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-12 relative z-10">
                    <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AuthLayout;
