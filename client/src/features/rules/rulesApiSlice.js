import { apiSlice } from "../../app/api";

export const rulesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getRules: builder.query({
            query: () => ({
                url: "/rules",
            }),
            providesTags: ["Rule"],
        }),
    }),
});

export const { useGetRulesQuery } = rulesApiSlice;
