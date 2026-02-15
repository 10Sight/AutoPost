import React from "react";
import { Menu } from "lucide-react";
import { useGetCurrentUserQuery } from "../../features/auth/authApi";

const Topbar = ({ setSidebarOpen }) => {
    const { data: user } = useGetCurrentUserQuery();

    return (
        <header className="flex h-16 flex-shrink-0 items-center justify-between bg-white px-4 shadow dark:bg-gray-800 md:px-6">
            <button
                className="md:hidden text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
            >
                <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center ml-auto space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.data?.name}
                </span>
                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                    {user?.data?.name?.charAt(0).toUpperCase() || "U"}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
