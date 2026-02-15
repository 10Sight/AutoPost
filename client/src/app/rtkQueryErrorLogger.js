import { isRejectedWithValue, isFulfilled } from "@reduxjs/toolkit";
import { toast } from "sonner";

/**
 * Log a warning and show a toast!
 */
export const rtkQueryErrorLogger = (api) => (next) => (action) => {
    // RTK Query uses `pending`, `fulfilled`, `rejected` actions

    // Handle Errors
    if (isRejectedWithValue(action)) {
        console.warn("We got a rejected action!", action);

        const status = action.payload?.status;
        const data = action.payload?.data;
        const errorMessage = data?.message || action.error?.message || "An unexpected error occurred";

        // Specialized Error Handling
        if (status === 401) {
            // Let the auth slice or router handle redirection, but show a toast
            toast.error("Session Expired", {
                description: "Please login again to continue.",
            });
        } else if (status === 403) {
            toast.error("Permission Denied", {
                description: errorMessage,
            });
        } else {
            // Generic API Error
            toast.error("Error", {
                description: errorMessage,
            });
        }
    }

    // Handle Success (Optional - can be noisy if enabled for ALL queries)
    // We strictly filter for mutations (POST, PUT, DELETE) to avoid toasting on GETs
    if (isFulfilled(action)) {
        const meta = action.meta;
        if (meta?.arg?.type === "mutation") {
            const data = action.payload;
            // Only show toast if the backend sends a success message
            if (data?.message) {
                toast.success("Success", {
                    description: data.message,
                });
            }
        }
    }

    return next(action);
};
