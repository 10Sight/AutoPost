import { createApi } from "@reduxjs/toolkit/query/react";
import axiosInstance from "../Helper/axiosInstance";

const axiosBaseQuery =
    ({ baseUrl } = { baseUrl: "" }) =>
        async ({ url, method, data, body, params, headers }) => {
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
    tagTypes: ["User", "SocialAccount", "Media", "ScheduledPost"],
    endpoints: (builder) => ({}),
});
