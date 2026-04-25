import { apiSlice } from "../../app/api";

export const accountGroupApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getGroups: builder.query({
            query: () => ({
                url: "/account-groups",
                method: "GET",
            }),
            providesTags: ["AccountGroup"],
        }),
        createGroup: builder.mutation({
            query: (data) => ({
                url: "/account-groups",
                method: "POST",
                data,
            }),
            invalidatesTags: ["AccountGroup"],
        }),
        updateGroup: builder.mutation({
            query: ({ groupId, ...data }) => ({
                url: `/account-groups/${groupId}`,
                method: "PATCH",
                data,
            }),
            invalidatesTags: ["AccountGroup"],
        }),
        assignAccountToGroup: builder.mutation({
            query: ({ groupId, accountId }) => ({
                url: `/account-groups/${groupId}/accounts`,
                method: "POST",
                data: { accountId },
            }),
            invalidatesTags: ["AccountGroup", "SocialAccount"],
        }),
        deleteGroup: builder.mutation({
            query: (groupId) => ({
                url: `/account-groups/${groupId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AccountGroup"],
        }),
    }),
});

export const {
    useGetGroupsQuery,
    useCreateGroupMutation,
    useUpdateGroupMutation,
    useAssignAccountToGroupMutation,
    useDeleteGroupMutation,
} = accountGroupApiSlice;
