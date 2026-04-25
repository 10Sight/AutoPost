import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { 
    LayoutDashboard, 
    Building2, 
    ShieldAlert, 
    LogOut, 
    ChevronRight, 
    UserCircle,
    Command,
    Search,
    Menu,
    X,
    TrendingUp,
    Palette
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { Input } from "../../components/ui/input";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";

const SuperadminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const user = useSelector(selectCurrentUser);

    const navItems = [
        { 
            title: "Organizations", 
            icon: Building2, 
            path: "/admin-panel/organizations",
            description: "Manage client tenants & authority" 
        },
        { 
            title: "Platform Health", 
            icon: ShieldAlert, 
            path: "/admin-panel/health",
            description: "Live diagnostics & failure feed" 
        },
        { 
            title: "Growth Metrics", 
            icon: TrendingUp, 
            path: "/admin-panel/analytics",
            description: "Overall system scale & usage" 
        },
        { 
            title: "Workspace Branding", 
            icon: Palette, 
            path: "/admin-panel/branding",
            description: "Global identity & visual theme" 
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
            {/* Master Command Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50",
                isSidebarOpen ? "w-72" : "w-20"
            )}>
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center gap-3 px-2 mb-10">
                        <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/30">
                            <Command className="w-6 h-6 text-white" />
                        </div>
                        {isSidebarOpen && (
                            <span className="font-black text-xl tracking-tight dark:text-white">CONTROL <span className="text-primary font-light">PANEL</span></span>
                        )}
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-2xl transition-all group",
                                        isActive 
                                            ? "bg-primary text-white shadow-xl shadow-primary/20" 
                                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-primary")} />
                                    {isSidebarOpen && (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{item.title}</span>
                                            <span className={cn("text-[10px] opacity-70", isActive ? "text-white" : "text-slate-400")}>{item.description}</span>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start gap-4 p-3 rounded-2xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            onClick={() => navigate("/dashboard")}
                        >
                            <LogOut className="w-5 h-5" />
                            {isSidebarOpen && <span className="font-bold text-sm">Return to Dashboard</span>}
                        </Button>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-4 top-10 p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-slate-400 hover:text-primary transition-colors"
                >
                    <ChevronRight className={cn("w-3 h-3 transition-transform", isSidebarOpen ? "rotate-180" : "0")} />
                </button>
            </aside>

            {/* Main Content Node */}
            <main className={cn(
                "flex-1 transition-all duration-300 min-w-0 p-4 md:p-8 lg:p-12 mb-20 md:mb-0",
                isSidebarOpen ? "ml-72" : "ml-20"
            )}>
                <header className="flex items-center justify-between mb-10 bg-white/30 dark:bg-slate-900/30 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl">
                    <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                            <UserCircle className="w-3.5 h-3.5" />
                            SYSTEM MASTER
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-black dark:text-white uppercase tracking-tighter">{user?.name}</span>
                            <span className="text-[10px] text-primary font-bold tracking-widest uppercase">Platform Architect</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-600 p-0.5">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center font-black text-primary">
                                {user?.name?.[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SuperadminLayout;
