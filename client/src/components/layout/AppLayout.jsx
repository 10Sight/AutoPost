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
    Gavel
} from "lucide-react";
import { toast } from "sonner";
import NotificationBell from "../common/NotificationBell";

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
    const { data: orgData } = useGetOrganizationQuery();
    const [logoutApi, { isLoading }] = useLogoutMutation();

    const organization = orgData?.data;
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
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            if (mobile) {
                setCollapsed(true);
            } else if (window.innerWidth >= 1024) {
                setCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setCollapsed((prev) => !prev);
    };

    const handleLogout = async () => {
        try {
            await logoutApi().unwrap();
            dispatch(logOut());
            navigate("/auth/login", { replace: true });
        } catch (error) {
            dispatch(logOut());
            navigate("/auth/login", { replace: true });
        }
    };

    const ToggleButton = ({ opened, onClick, ariaLabel }) => {
        return (
            <Menu
                className={`min-w-5 min-h-5 duration-500 transition-all cursor-pointer text-[#4b5563] hover:text-[#1f2937]`}
                onClick={onClick}
                aria-label={ariaLabel}
            />
        );
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-[#f9fafb] via-[#eff6ff]/30 to-[#eef2ff]/20 dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900/20">
            {/* Mobile overlay */}
            {/* Mobile overlay - Removed as we have bottom nav now */}

            {/* Sidebar (Desktop) */}
            {!isMobile && (
                <nav
                    className={`fixed top-0 left-0 h-screen bg-[#ffffff]/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-[#e5e7eb]/50 dark:border-gray-800/50 text-[#000000] dark:text-white shadow-2xl transition-all duration-300 z-20
                ${collapsed ? "w-16" : "w-64"}`}
                >
                    <div
                        className={`relative h-16 items-center flex transition-all p-4 duration-300 z-50 border-b border-[#e5e7eb]/80 dark:border-gray-800/80 bg-[#ffffff]/50 dark:bg-gray-900/50`}
                    >
                        <ToggleButton
                            opened={!collapsed}
                            onClick={toggleSidebar}
                            ariaLabel="Toggle sidebar"
                        />
                        {!collapsed && (
                            <div className="ml-4 flex items-center gap-2 overflow-hidden">
                                {branding.logo ? (
                                    <img src={branding.logo} alt="Logo" className="h-8 w-auto object-contain" />
                                ) : (
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        {organization?.name || "AutoPost"}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Tabs */}
                    <div className="px-3 flex flex-col w-full py-6 space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)] scrollbar-thin scrollbar-thumb-[#d1d5db] scrollbar-track-[#f3f4f6] hover:scrollbar-thumb-[#9ca3af]">
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
                                            ? "bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-[#ffffff] shadow-lg shadow-[#bfdbfe] dark:shadow-blue-900/20"
                                            : "text-[#4b5563] dark:text-gray-400 hover:bg-gradient-to-r hover:from-[#eff6ff] hover:to-[#eef2ff] hover:text-[#1d4ed8] dark:hover:from-gray-800 dark:hover:to-gray-800 dark:hover:text-blue-400 hover:shadow-md"
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

                    {/* Logout */}
                    <div className="absolute bottom-6 w-full px-3">
                        <div
                            className={`group p-3 flex items-center rounded-xl w-full transition-all duration-300 ${isLoading
                                ? "opacity-50 cursor-not-allowed bg-[#f3f4f6] dark:bg-gray-800"
                                : "hover:bg-gradient-to-r hover:from-[#fef2f2] hover:to-[#fdf2f8] hover:text-[#dc2626] cursor-pointer hover:shadow-md dark:hover:from-red-900/10 dark:hover:to-red-900/10 dark:text-gray-400"
                                } ${collapsed ? "justify-center mx-1" : "px-4"
                                }`}
                            onClick={isLoading ? undefined : handleLogout}
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#dc2626]"></div>
                            ) : (
                                <LogOut className="min-w-5 min-h-5 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                            )}
                            {!collapsed && (
                                <span className="ml-3 text-sm font-medium transition-all group-hover:translate-x-0.5">
                                    {isLoading ? "Logging out..." : "Logout"}
                                </span>
                            )}
                        </div>
                    </div>
                </nav>
            )}

            {/* Bottom Navigation (Mobile) */}
            {isMobile && (
                <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#ffffff]/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-[#e5e7eb]/50 dark:border-gray-800/50 rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-evenly items-center z-50 pb-safe">
                    {baseTabs.map((item) => {
                        const isActive =
                            pathname === item.link ||
                            (item.link === "/dashboard" && pathname === "/dashboard") ||
                            (item.link !== "/dashboard" && pathname.startsWith(item.link));

                        return (
                            <div
                                key={item.label}
                                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 active:scale-95 ${isActive ? '-translate-y-3' : ''}`}
                                onClick={() => navigate(item.link)}
                            >
                                <div className={`p-2 rounded-full transition-all duration-300 ${isActive
                                    ? "bg-gradient-to-tr from-[#2563eb] to-[#4f46e5] text-white shadow-lg shadow-blue-500/30 ring-4 ring-white dark:ring-gray-900"
                                    : "text-gray-500 dark:text-gray-400"
                                    }`}>
                                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {isActive && (
                                    <span className="absolute -bottom-5 text-[10px] font-semibold text-gray-900 dark:text-white animate-in slide-in-from-top-1 fade-in duration-300 whitespace-nowrap">
                                        {item.label}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                    <div
                        className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 active:scale-95"
                        onClick={handleLogout}
                    >
                        <div className="p-2 rounded-full text-red-500">
                            <LogOut className="w-5 h-5" strokeWidth={2} />
                        </div>
                    </div>
                </nav>
            )}

            {/* Main Content Area */}
            <div
                className={`flex-1 transition-all duration-300 ${isMobile ? "ml-0 mb-20" : collapsed ? "ml-16" : "ml-64"
                    }`}
            >
                {/* Header */}
                <header
                    className={`px-4 sm:px-6 bg-[#ffffff]/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-sm border-b border-[#e5e7eb]/80 dark:border-gray-800/80 flex h-16 items-center justify-between gap-2 sm:gap-4 fixed right-0 top-0 z-30 transition-all duration-300 ${isMobile ? "w-full" : collapsed ? "w-[calc(100%-4rem)]" : "w-[calc(100%-16rem)]"
                        }`}
                >
                    {/* Mobile menu button */}
                    <div className="flex items-center gap-3">
                        {/* Mobile menu button - Removed */}

                        {/* Breadcrumb */}
                        <Breadcrumb className="hidden sm:block">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center text-[#2563eb] hover:text-[#1e40af] dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                    >
                                        <Home size={18} aria-hidden="true" />
                                        <span className="sr-only">Home</span>
                                    </Link>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-[#1f2937] dark:text-gray-200 font-medium">
                                        {pageName}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Mobile page title */}
                        <h1 className="font-semibold text-[#1f2937] dark:text-white text-lg sm:hidden">
                            {pageName}
                        </h1>
                    </div>

                    {/* Right side (Notifications & Avatar) */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <NotificationBell />

                        {/* User Dropdown Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-[#bfdbfe] dark:hover:ring-blue-900 transition-all">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage
                                            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=${primaryColor.replace('#', '')}&color=fff`}
                                            alt={user?.name || 'User'}
                                        />
                                        <AvatarFallback style={{ backgroundColor: primaryColor }} className="text-[#ffffff]">
                                            {(user?.name || 'U').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bg-[#22c55e] rounded-full bottom-0 right-0 size-2.5 border-2 border-[#ffffff] dark:border-gray-900 animate-pulse"></div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-[#111827] dark:text-white">
                                                {user?.name || 'User'}
                                            </p>
                                            <Badge variant="secondary" className="text-xs">
                                                {organization?.name || "Organization"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-[#6b7280] dark:text-gray-400">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer hover:bg-[#eff6ff] dark:hover:bg-gray-800" onClick={() => navigate('/dashboard/accounts')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Data Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer hover:bg-[#fef2f2] text-[#dc2626] focus:text-[#dc2626] dark:focus:bg-red-900/20"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <div className={`pt-20 pb-6 px-4 sm:px-6 min-h-screen ${isMobile ? 'pb-24' : ''}`}>
                    <div className="bg-[#ffffff]/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#e5e7eb]/50 dark:border-gray-700/50 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
