import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../features/auth/authSlice";

const ProtectedRoute = () => {
    const token = useSelector(selectCurrentToken);
    const location = useLocation();

    // If no token, redirect to login page with the return url
    if (!token) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    // If token exists, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
