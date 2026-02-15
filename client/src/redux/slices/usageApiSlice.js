import { apiSlice } from "../../app/api";

export const usageApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsage: builder.query({
            query: () => ({ url: "/usage" }),
            providesTags: ["Usage"],
        }),
    }),
});

export const { useGetUsageQuery } = usageApiSlice;
