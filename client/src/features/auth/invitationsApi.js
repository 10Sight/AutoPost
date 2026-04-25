import { apiSlice } from "../../app/api";

export const invitationsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPendingInvitations: builder.query({
            query: () => "/invitations",
            providesTags: ["Invitations"],
        }),
        sendInvitation: builder.mutation({
            query: (inviteData) => ({
                url: "/invitations",
                method: "POST",
                body: inviteData,
            }),
            invalidatesTags: ["Invitations"],
        }),
        cancelInvitation: builder.mutation({
            query: (inviteId) => ({
                url: `/invitations/${inviteId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Invitations"],
        }),
        verifyInvitation: builder.query({
            query: (token) => `/invitations/verify/${token}`,
        }),
    }),
});

export const {
    useGetPendingInvitationsQuery,
    useSendInvitationMutation,
    useCancelInvitationMutation,
    useVerifyInvitationQuery,
} = invitationsApi;
