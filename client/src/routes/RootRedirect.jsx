import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../features/auth/authSlice";
import Home from "../pages/Home";

const RootRedirect = () => {
    const token = useSelector(selectCurrentToken);

    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Home />;
};

export default RootRedirect;
