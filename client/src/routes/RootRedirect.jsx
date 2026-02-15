import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../features/auth/authSlice";

const RootRedirect = () => {
    const token = useSelector(selectCurrentToken);

    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to="/auth/login" replace />;
};

export default RootRedirect;
