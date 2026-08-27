import React, { useState, useRef, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
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

const SuperadminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const user = useSelector(selectCurrentUser);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const activeItem = useMemo(
        () => navItems.find((item) => location.pathname.startsWith(item.path)),
        [location.pathname]
    );

    // Sliding active-tab indicator
    const navRef = useRef(null);
    const tabRefs = useRef({});
    const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, left: 0, width: 0, height: 0, opacity: 0 });

    const updateIndicator = useCallback(() => {
        const activeEl = activeItem ? tabRefs.current[activeItem.path] : null;
        const navEl = navRef.current;
        if (!activeEl || !navEl) {
            setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
            return;
        }
        const navRect = navEl.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        const inset = 4;
        setIndicatorStyle({
            top: elRect.top - navRect.top + inset,
            left: elRect.left - navRect.left + inset,
            width: elRect.width - inset * 2,
            height: elRect.height - inset * 2,
            opacity: 1,
        });
    }, [activeItem]);

    useLayoutEffect(() => {
        updateIndicator();
    }, [updateIndicator, isSidebarOpen]);

    useEffect(() => {
        const navEl = navRef.current;
        if (!navEl) return undefined;
        const observer = new ResizeObserver(() => updateIndicator());
        observer.observe(navEl);
        return () => observer.disconnect();
    }, [updateIndicator]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans overflow-x-hidden">
            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Master Command Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-[70]",
                // Desktop width logic
                !isMobile && (isSidebarOpen ? "w-72" : "w-20"),
                // Mobile logic
                isMobile && "w-72",
                isMobile && (isSidebarOpen ? "translate-x-0" : "-translate-x-full")
            )}>
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center gap-3 px-2 mb-10">
                        <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/30 flex-shrink-0">
                            <Command className="w-6 h-6 text-white" />
                        </div>
                        {isSidebarOpen && (
                            <span className="font-black text-xl tracking-tight dark:text-white truncate">CONTROL <span className="text-primary font-light">PANEL</span></span>
                        )}
                        {isMobile && isSidebarOpen && (
                            <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsSidebarOpen(false)}>
                                <X className="w-5 h-5 text-slate-400" />
                            </Button>
                        )}
                    </div>

                    <nav ref={navRef} className="relative flex-1 flex flex-col gap-2">
                        {/* Sliding active-tab indicator */}
                        <div
                            className="absolute top-0 left-0 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/30 dark:border-primary/40 transition-[transform,width,height,opacity] duration-300 ease-out will-change-transform pointer-events-none"
                            style={{
                                transform: `translate(${indicatorStyle.left}px, ${indicatorStyle.top}px)`,
                                width: indicatorStyle.width,
                                height: indicatorStyle.height,
                                opacity: indicatorStyle.opacity,
                            }}
                        />

                        {navItems.map((item) => {
                            const isActive = activeItem?.path === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    ref={(el) => {
                                        tabRefs.current[item.path] = el;
                                    }}
                                    to={item.path}
                                    onClick={() => isMobile && setIsSidebarOpen(false)}
                                    className={cn(
                                        "relative z-10 flex items-center gap-3 p-3 rounded-2xl transition-colors duration-200 group",
                                        isActive
                                            ? "text-primary dark:text-white font-semibold"
                                            : "text-slate-500 dark:text-slate-400 font-medium hover:text-primary dark:hover:text-primary hover:bg-slate-100/40 dark:hover:bg-slate-800/20",
                                        !isSidebarOpen && "justify-center"
                                    )}
                                >
                                    {!isSidebarOpen && isActive ? (
                                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                                            <item.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                        </div>
                                    ) : (
                                        <item.icon className="w-5 h-5 min-w-[20px]" strokeWidth={isActive ? 2.5 : 1.75} />
                                    )}
                                    {isSidebarOpen && (
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm truncate">{item.title}</span>
                                            <span className={cn(
                                                "text-[10px] opacity-70 truncate",
                                                isActive ? "text-primary/80 dark:text-white/70" : "text-slate-400"
                                            )}>{item.description}</span>
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
                            <LogOut className="w-5 h-5 min-w-[20px]" />
                            {isSidebarOpen && <span className="font-bold text-sm truncate">Exit Command Center</span>}
                        </Button>
                    </div>
                </div>
                
                {!isMobile && (
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="absolute -right-4 top-10 p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-slate-400 hover:text-primary transition-colors"
                    >
                        <ChevronRight className={cn("w-3 h-3 transition-transform", isSidebarOpen ? "rotate-180" : "0")} />
                    </button>
                )}
            </aside>

            {/* Main Content Node */}
            <main className={cn(
                "flex-1 transition-all duration-300 min-w-0 p-4 sm:p-8 lg:p-12 mb-20 md:mb-0",
                !isMobile && (isSidebarOpen ? "ml-72" : "ml-20")
            )}>
                <header className="flex items-center justify-between gap-4 mb-6 sm:mb-10 bg-white/30 dark:bg-slate-900/30 p-3 sm:p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-slate-500">
                                <Menu className="w-5 h-5" />
                            </Button>
                        )}
                        <div className="flex items-center gap-2 text-[10px] font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 whitespace-nowrap">
                            <UserCircle className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">SYSTEM MASTER</span>
                            <span className="xs:hidden">MASTER</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                        <div className="hidden sm:flex flex-col items-end min-w-0">
                            <span className="text-sm font-black dark:text-white uppercase tracking-tighter truncate max-w-[150px]">{user?.name}</span>
                            <span className="text-[10px] text-primary font-bold tracking-widest uppercase">Architect</span>
                        </div>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-primary to-blue-600 p-0.5 flex-shrink-0">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center font-black text-primary text-sm">
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
