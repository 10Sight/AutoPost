import { apiSlice } from "../../app/api";

export const superadminApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllOrganizations: builder.query({
            query: () => ({
                url: "/superadmin/organizations",
            }),
            providesTags: ["Organization"],
        }),
        createOrganization: builder.mutation({
            query: (orgData) => ({
                url: "/superadmin/organizations",
                method: "POST",
                body: orgData,
            }),
            invalidatesTags: ["Organization"],
        }),
        updateOrganizationStatus: builder.mutation({
            query: ({ orgId, status }) => ({
                url: `/superadmin/organizations/${orgId}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: ["Organization"],
        }),
        updateOrganizationQuota: builder.mutation({
            query: ({ orgId, quota }) => ({
                url: `/superadmin/organizations/${orgId}/quota`,
                method: "PATCH",
                body: { quota },
            }),
            invalidatesTags: ["Organization"],
        }),
        impersonateUser: builder.mutation({
            query: (userId) => ({
                url: `/superadmin/impersonate/${userId}`,
                method: "POST",
            }),
            // This will typically trigger a full app reload or redirect
        }),
        getGlobalHealth: builder.query({
            query: (params) => ({
                url: "/superadmin/health",
                params,
            }),
            providesTags: ["AuditLog"],
        }),
        getGrowthMetrics: builder.query({
            query: () => ({
                url: "/superadmin/analytics/growth",
            }),
            providesTags: ["GrowthMetrics"],
        }),
    }),
});

export const {
    useGetAllOrganizationsQuery,
    useCreateOrganizationMutation,
    useUpdateOrganizationStatusMutation,
    useUpdateOrganizationQuotaMutation,
    useImpersonateUserMutation,
    useGetGlobalHealthQuery,
    useGetGrowthMetricsQuery,
} = superadminApi;
