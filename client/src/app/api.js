import { createApi } from "@reduxjs/toolkit/query/react";
import axiosInstance from "../Helper/axiosInstance";

const axiosBaseQuery =
    ({ baseUrl } = { baseUrl: "" }) =>
        async ({ url, method, data, body, params, headers }) => {
            // Defensive check for "undefined" in URL or explicit invalid markers
            if (url === undefined || url === null || url === "undefined" || url === "/undefined" || url === "/invalid-media" || url === "invalid-media" || url?.toString()?.includes("/undefined") || url?.toString()?.endsWith("/undefined")) {
                if (import.meta.env.MODE === 'development') {
                    console.error(`[RTK Query] Blocked malformed request: ${method || 'GET'} ${url}`);
                }
                return { 
                    error: { 
                        status: 'CUSTOM_ERROR', 
                        data: 'Malformed URL blocked' 
                    } 
                };
            }

            // Only log in development or if explicitly debugging
            // console.log(`[RTK Query] Request: ${method || 'GET'} ${url}`);
            try {
                const result = await axiosInstance({
                    url: baseUrl + url,
                    method,
                    data: data || body,
                    params,
                    headers,
                });
                return { data: result.data };
            } catch (axiosError) {
                const err = axiosError;
                return {
                    error: {
                        status: err.response?.status,
                        data: err.response?.data || err.message,
                    },
                };
            }
        };

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: axiosBaseQuery({ baseUrl: "" }),
    tagTypes: ["User", "SocialAccount", "Media", "ScheduledPost", "AccountGroup", "Engagement", "Comments", "YouTubeAnalytics", "Invitations"],
    endpoints: (builder) => ({}),
});
