import { apiSlice } from "../../app/api";

export const organizationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getOrganization: builder.query({
            query: () => ({
                url: "/organization",
            }),
            providesTags: ["Organization"],
        }),
        updateOrganization: builder.mutation({
            query: (data) => ({
                url: "/organization",
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["Organization"],
        }),
    }),
});

export const { useGetOrganizationQuery, useUpdateOrganizationMutation } = organizationApiSlice;
