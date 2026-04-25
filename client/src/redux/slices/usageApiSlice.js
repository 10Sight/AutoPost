import { apiSlice } from "../../app/api";

export const usageApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAccountUsage: builder.query({
            query: () => ({ url: "/usage/current" }),
            providesTags: ["Usage"],
        }),
    }),
});

export const { useGetAccountUsageQuery } = usageApiSlice;
