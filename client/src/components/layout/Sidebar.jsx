import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Image,
    CalendarClock,
    PenSquare,
    LogOut,
    X,
} from "lucide-react";
import { useLogoutMutation } from "../../features/auth/authApi";
import { useNavigate } from "react-router-dom";

const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Accounts", href: "/dashboard/accounts", icon: Users },
    { name: "Media Library", href: "/dashboard/media", icon: Image },
    { name: "Scheduler", href: "/dashboard/scheduler", icon: CalendarClock },
    { name: "Create Post", href: "/dashboard/create", icon: PenSquare },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [logout] = useLogoutMutation();

    const handleLogout = async () => {
        try {
            await logout().unwrap();
            navigate("/auth/login");
        } catch (err) {
            console.error("Failed to logout", err);
        }
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Sidebar container */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 text-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-16 items-center justify-between px-4 bg-gray-800">
                    <span className="text-xl font-bold tracking-wider">Prioritize</span>
                    <button
                        className="md:hidden text-gray-300 hover:text-white"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-5 space-y-1 px-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${location.pathname === item.href
                                ? "bg-gray-800 text-white"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            <item.icon
                                className={`mr-4 h-6 w-6 flex-shrink-0 transition-colors ${location.pathname === item.href
                                    ? "text-white"
                                    : "text-gray-400 group-hover:text-gray-300"
                                    }`}
                            />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full bg-gray-800 p-4">
                    <button
                        onClick={handleLogout}
                        className="group flex w-full items-center px-2 py-2 text-base font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        <LogOut className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-300" />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
