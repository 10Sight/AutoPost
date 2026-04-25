import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { logOut, selectCurrentUser } from "../../features/auth/authSlice";
import { useLogoutMutation } from "../../features/auth/authApi";
import { useGetOrganizationQuery } from "../../redux/slices/organizationApiSlice";
import {
    LayoutDashboard,
    User,
    Users,
    Settings,
    Image,
    CalendarClock,
    LogOut,
    Menu,
    ChevronRight,
    Search,
    Download,
    Laptop2,
    PenSquare,
    Home,
    TrendingUp,
    ShieldAlert,
    Gavel,
    Crown,
    Building2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import NotificationBell from "../common/NotificationBell";
import ImpersonationBanner from "./ImpersonationBanner";
import SuspendedScreen from "../common/SuspendedScreen";

const baseTabs = [
    { link: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { link: "/dashboard/create", label: "Create Post", icon: PenSquare },
    { link: "/dashboard/scheduler", label: "Scheduler", icon: CalendarClock },
    { link: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
    { link: "/dashboard/media", label: "Media Library", icon: Image },
    { link: "/dashboard/accounts", label: "Accounts", icon: Laptop2 },
    { link: "/dashboard/team", label: "Team", icon: Users },
    { link: "/dashboard/audit-logs", label: "Audit Logs", icon: ShieldAlert },
    { link: "/dashboard/policy-rules", label: "Policy Rules", icon: Gavel },
    { link: "/dashboard/org-settings", label: "Org Settings", icon: Settings },
];

const AppLayout = () => {
    const [collapsed, setCollapsed] = useState(
        window.innerWidth >= 820 ? false : true
    );
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [pageName, setPageName] = useState("Dashboard");

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const user = useSelector(selectCurrentUser);
    const { data: orgData, isLoading: isOrgLoading } = useGetOrganizationQuery();
    const [logoutApi, { isLoading }] = useLogoutMutation();

    const organization = orgData?.data;
    const isSuspended = !isOrgLoading && organization && organization.status !== "active" && user?.role !== "superadmin";
    const branding = organization?.branding || {};
    const primaryColor = branding.primaryColor || "#2563eb"; // Fallback to blue-600

    // Update page name based on current route
    useEffect(() => {
        const currentTab = baseTabs.find(tab =>
            pathname === tab.link ||
            (tab.link !== "/dashboard" && pathname.startsWith(tab.link))
        );

        if (currentTab) {
            setPageName(currentTab.label);
        } else if (pathname === "/dashboard") {
            setPageName("Dashboard");
        } else {
            const routeName = pathname.split("/").pop();
            setPageName(routeName.charAt(0).toUpperCase() + routeName.slice(1));
        }
    }, [pathname]);

    // Handle window resize for responsive behavior
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 820) {
                setCollapsed(true);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = async () => {
        try {
            await logoutApi().unwrap();
            dispatch(logOut());
            navigate("/auth/login");
        } catch (err) {
            toast.error("Failed to logout");
        }
    };

    return (
        <div className="flex h-screen bg-white dark:bg-[#0f172a] overflow-hidden font-sans">
            {isSuspended && <SuspendedScreen status={organization?.status} />}

            {/* Sidebar */}
            <div
                className={`${collapsed ? "w-20" : "w-72"
                    } h-screen bg-white dark:bg-[#0f172a] border-r border-[#e2e8f0] dark:border-gray-800 transition-all duration-300 ease-in-out flex flex-col z-20 overflow-hidden relative
          ${isMobile && (collapsed ? "-translate-x-full" : "translate-x-0 fixed")}`}
            >
                {/* Fixed Logo section */}
                <div className={cn(
                    "h-20 flex items-center border-b border-[#f1f5f9] dark:border-gray-800 bg-white/50 dark:bg-[#0f172a]/50 backdrop-blur-md transition-all duration-300",
                    collapsed ? "px-5" : "px-6"
                )}>
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-500",
                        branding.logoUrl
                            ? "bg-transparent"
                            : "bg-primary shadow-lg shadow-primary/20"
                    )}>
                        {branding.logoUrl ? (
                            <img
                                src={branding.logoUrl}
                                alt="Workspace Logo"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-6 h-6 flex items-center justify-center font-black text-white text-lg italic uppercase">
                                {organization?.name?.charAt(0) || "1"}
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <div className="ml-3 flex flex-col transition-all duration-300">
                            <span className="text-lg font-black tracking-tight text-[#1e293b] dark:text-gray-100 uppercase truncate max-w-[180px]">
                                {organization?.name || "10Sight"}
                            </span>
                            <span className="text-[10px] font-bold text-[#64748b] dark:text-gray-400 tracking-[0.2em] uppercase -mt-1">
                                Workspace
                            </span>
                        </div>
                    )}
                </div>

                {/* Sidebar Tabs */}
                <div className="px-3 flex flex-col w-full py-6 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide max-h-[calc(100vh-12rem)]">
                    {baseTabs.map((item) => {
                        // Hide Admin-only tabs
                        if (["/dashboard/org-settings", "/dashboard/policy-rules"].includes(item.link) && user?.role !== "admin") {
                            return null;
                        }

                        const isActive =
                            pathname === item.link ||
                            (item.link === "/dashboard" && pathname === "/dashboard") ||
                            (item.link !== "/dashboard" && pathname.startsWith(item.link));

                        return (
                            <div
                                className={`group relative flex items-center cursor-pointer w-full overflow-hidden h-12 rounded-xl transition-all duration-300 hover:scale-[1.02]
                ${isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "text-[#4b5563] dark:text-gray-400 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary hover:shadow-md"
                                    }
                ${collapsed ? "justify-center mx-1" : "items-center px-4"}`}
                                key={item.label}
                                onClick={() => {
                                    navigate(item.link);
                                }}
                            >
                                {isActive && !collapsed && (
                                    <div className="absolute left-0 top-0 h-full w-1 bg-[#ffffff] rounded-r-full" />
                                )}
                                <item.icon
                                    className={`${collapsed ? "w-5 h-5" : "min-w-5 min-h-5"
                                        } transition-transform group-hover:scale-110`}
                                    strokeWidth={isActive ? 2.5 : 1.5}
                                />
                                {!collapsed && (
                                    <span className="ml-3 text-sm font-medium transition-all group-hover:translate-x-0.5">
                                        {item.label}
                                    </span>
                                )}
                                {!collapsed && (
                                    <div className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-[#bfdbfe]' : 'text-[#9ca3af]'
                                        }`}>
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Superadmin Panel Access */}
                {user?.role === "superadmin" && (
                    <div className="px-3 mb-2">
                        <div
                            className={cn("group p-3 flex items-center rounded-xl w-full transition-all duration-300 bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 hover:shadow-md overflow-hidden", collapsed && "justify-center")}
                            onClick={() => navigate("/admin-panel")}
                        >
                            <Crown className={cn("min-w-5 min-h-5 animate-pulse", collapsed ? "" : "mr-3")} />
                            {!collapsed && (
                                <span className="text-sm font-black uppercase tracking-tighter">
                                    Command Center
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Logout */}
                <div className="absolute bottom-6 w-full px-3">
                    <div
                        className={cn("group p-3 flex items-center rounded-xl w-full transition-all duration-300 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer overflow-hidden", collapsed && "justify-center")}
                        onClick={handleLogout}
                    >
                        <LogOut className={cn("min-w-5 min-h-5 transition-transform group-hover:-translate-x-0.5", collapsed ? "" : "mr-3")} />
                        {!collapsed && (
                            <span className="text-sm font-bold">Sign Out</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-[#020617] overflow-hidden relative">
                {/* Header */}
                <header className="h-20 flex items-center justify-between px-8 border-b border-[#f1f5f9] dark:border-gray-800 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-xl z-10">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapsed(!collapsed)}
                            className="text-[#64748b] dark:text-gray-400 hover:bg-[#f1f5f9] dark:hover:bg-gray-800 rounded-xl"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="hidden lg:block h-6 w-[1px] bg-[#e2e8f0] dark:bg-gray-800 mx-1" />

                        <div className="hidden md:flex flex-col">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <Link to="/dashboard" className="text-xs font-bold text-[#94a3b8] hover:text-[#2563eb] transition-colors flex items-center gap-1">
                                            <Home className="w-3 h-3" /> PRIORITIZE
                                        </Link>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-xs font-black text-[#1e293b] dark:text-white uppercase tracking-wider">{pageName}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Global Search */}
                        <div className="hidden xl:flex relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8] group-focus-within:text-[#2563eb] transition-colors" />
                            <input
                                type="text"
                                placeholder="Global search..."
                                className="w-64 h-10 pl-10 pr-4 bg-[#f8fafc] dark:bg-gray-900 border border-[#e2e8f0] dark:border-gray-800 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <NotificationBell />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-[#f1f5f9] dark:hover:bg-gray-800 cursor-pointer transition-all border border-[#f1f5f9] dark:border-gray-800">
                                        <Avatar className="h-9 w-9 border-2 border-white dark:border-gray-700 shadow-sm">
                                            <AvatarImage
                                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random`}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="font-bold text-sm bg-[#2563eb] text-white">
                                                {user?.name?.[0] || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        {!isMobile && (
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-[#1e293b] dark:text-gray-100 leading-none mb-1 capitalize truncate max-w-[100px]">
                                                    {user?.name}
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-600 leading-none uppercase tracking-tighter">
                                                    {user?.role}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl p-2 border-[#f1f5f9] dark:border-gray-800 shadow-2xl">
                                    <DropdownMenuLabel className="px-3 py-2">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-[#1e293b]">{user?.name}</span>
                                            <span className="text-xs text-[#64748b]">{user?.email}</span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="rounded-xl p-3 gap-3 cursor-pointer">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span className="font-semibold text-sm">Profile Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate("/dashboard/account-status")} className="rounded-xl p-3 gap-3 cursor-pointer">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Laptop2 className="w-4 h-4" />
                                        </div>
                                        <span className="font-semibold text-sm">Account Status</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="rounded-xl p-3 gap-3 cursor-pointer text-rose-600 hover:bg-rose-50"
                                        onClick={handleLogout}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                                            <LogOut className="w-4 h-4" />
                                        </div>
                                        <span className="font-black text-sm">Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <ImpersonationBanner />
                <main className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    <Outlet />
                    <footer className="mt-8 p-8 flex flex-col items-center gap-2 opacity-30 group hover:opacity-100 transition-opacity">
                        <div className="h-[1px] w-12 bg-slate-300 dark:bg-gray-700" />
                        <span className="text-[10px] font-black tracking-[0.5em] text-slate-400">10SIGHT v2.0</span>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
