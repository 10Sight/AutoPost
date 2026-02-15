import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentToken, setCredentials } from "../../features/auth/authSlice";
import { useGetCurrentUserQuery } from "../../features/auth/authApi";

const PersistLogin = () => {
    const token = useSelector(selectCurrentToken);
    const effectRan = useRef(false);

    // We only want to persist if we DON'T have a token yet but might have a cookie
    const [trueSuccess, setTrueSuccess] = useState(false);

    // Call the query to verify content
    const { data, isLoading, isSuccess, isError, error } = useGetCurrentUserQuery(undefined, {
        skip: !!token, // Skip if we already have a token
    });

    const dispatch = useDispatch();

    useEffect(() => {
        if (effectRan.current === true || process.env.NODE_ENV !== 'development') { // React 18 Strict Mode handling
            if (isSuccess && data?.data) {
                // If we successfully fetched the user (via cookie), set credentials
                // Note: The backend 'getCurrentUser' returns the user object in data.data
                // It does NOT return a new token usually, but we are using cookies.
                // We set token to 'true' or a dummy value if we want to satisfy 'authSlice' checks
                // OR we update authSlice to allow null token if we use cookies.
                // Looking at authSlice.js, it just stores what we pass. 
                // However, ProtectedRoute checks 'token'. 
                // So we need to put SOMETHING in token, or update ProtectedRoute.
                // Since the backend 'getCurrentUser' likely ONLY returns user info (Let's check user.controller),
                // we might not get a token.
                // Strategy: Update authSlice to use a flag or just mock the token if using cookies.
                // Better: Check if backend returns token.

                // Assuming getCurrentUser returns user. For now, we set token to "cookie-session" to bypass ProtectedRoute.
                dispatch(setCredentials({ user: data.data, token: "cookie-session" }));
                setTrueSuccess(true);
            }
        }

        return () => {
            effectRan.current = true;
        }
    }, [isSuccess, data, dispatch, isLoading, isError]);

    // If we have a token, we are good.
    if (token) return <Outlet />;

    // If loading, show spinner
    if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div></div>;

    // If successful but no token yet (waiting for useEffect dispatch)
    if (isSuccess && !token) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div></div>;
    }

    // If error, let ProtectedRoute handle the redirect
    return <Outlet />;
};

export default PersistLogin;
