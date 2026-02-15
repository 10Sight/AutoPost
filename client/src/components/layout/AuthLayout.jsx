import React from "react";
import { Outlet } from "react-router-dom";
import { Sparkles, Calendar, BarChart3, Share2 } from "lucide-react";

const AuthLayout = () => {
    return (
        <div className="flex min-h-screen bg-white dark:bg-gray-950 overflow-hidden font-sans">
            {/* Left Side: Visual/Branding Panel (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center">
                {/* Background Patterns/Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90 z-0" />
                <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl opacity-50" />
                <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10 p-12 max-w-xl text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">AutoSocial</h1>
                    </div>

                    <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-8">
                        The smarter way to <span className="text-blue-200">schedule</span> and <span className="text-blue-200">grow</span>.
                    </h2>

                    <div className="space-y-6">
                        {[
                            { icon: Calendar, text: "Schedule weeks of content in minutes." },
                            { icon: BarChart3, text: "Track performance across all platforms." },
                            { icon: Share2, text: "Manage all accounts from one dashboard." }
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-4 group cursor-default">
                                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors duration-300">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <p className="text-lg text-white/90 font-medium">{feature.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10">
                        <p className="italic text-white/80">
                            "AutoSocial has completely transformed how we handle our social presence. Automated, effortless, and effective."
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-300" />
                            <div>
                                <p className="text-sm font-bold">Sarah Jenkins</p>
                                <p className="text-xs text-white/60">Digital Marketer</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Forms */}
            <div className="flex flex-col flex-1 items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
                {/* Mobile Logo Only */}
                <div className="lg:hidden absolute top-8 left-0 right-0 flex justify-center items-center gap-2 mb-8">
                    <div className="p-2 bg-primary rounded-xl">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">AutoSocial</span>
                </div>

                <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Outlet />

                    <footer className="mt-12 text-center text-gray-500 text-sm">
                        <p>&copy; {new Date().getFullYear()} AutoSocial Inc. All rights reserved.</p>
                        <div className="flex justify-center gap-4 mt-2">
                            <a href="#" className="hover:text-primary transition-colors duration-200">Privacy</a>
                            <a href="#" className="hover:text-primary transition-colors duration-200">Terms</a>
                            <a href="#" className="hover:text-primary transition-colors duration-200">Help</a>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
