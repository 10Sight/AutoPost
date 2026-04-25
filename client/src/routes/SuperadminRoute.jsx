import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";

const SuperadminRoute = () => {
    const user = useSelector(selectCurrentUser);

    if (!user || user.role !== "superadmin") {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default SuperadminRoute;
