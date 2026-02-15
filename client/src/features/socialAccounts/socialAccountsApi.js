import { apiSlice } from "../../app/api";

export const socialAccountApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getConnectedAccounts: builder.query({
            query: () => ({
                url: "/social-accounts",
            }),
            providesTags: ["SocialAccount"],
        }),
        connectAccount: builder.mutation({
            query: (accountData) => ({
                url: "/social-accounts/connect",
                method: "POST",
                data: accountData,
            }),
            invalidatesTags: ["SocialAccount"],
        }),
        disconnectAccount: builder.mutation({
            query: (platform) => ({
                url: `/social-accounts/${platform}`,
                method: "DELETE",
            }),
            invalidatesTags: ["SocialAccount"],
        }),
        getYouTubeAuthUrl: builder.query({
            query: () => ({
                url: "/youtube/auth",
            }),
        }),
        saveYouTubeAccount: builder.mutation({
            query: ({ code, state }) => ({
                url: "/youtube/callback",
                method: "GET",
                params: { code, state },
            }),
            invalidatesTags: ["SocialAccount"],
        }),
        getYouTubeChannel: builder.query({
            query: () => ({
                url: "/youtube/channel",
            }),
            providesTags: ["SocialAccount"],
        }),
        disconnectYouTube: builder.mutation({
            query: () => ({
                url: "/youtube/channel",
                method: "DELETE",
            }),
            invalidatesTags: ["SocialAccount"],
        }),
        validateYouTubeVideo: builder.mutation({
            query: (mediaId) => ({
                url: "/youtube/validate",
                method: "POST",
                data: { mediaId },
            }),
        }),
        scheduleYouTubePost: builder.mutation({
            query: (postData) => ({
                url: "/youtube/schedule",
                method: "POST",
                data: postData,
            }),
            invalidatesTags: ["ScheduledPost"],
        }),
        getYouTubeQuotaMetrics: builder.query({
            query: () => ({
                url: "/youtube/quota-metrics",
                method: "GET",
            }),
            providesTags: ["Usage"],
        }),
        getYouTubeAnalytics: builder.query({
            query: () => ({
                url: "/youtube/analytics",
                method: "GET",
            }),
        }),
    }),
});

export const {
    useGetConnectedAccountsQuery,
    useConnectAccountMutation,
    useDisconnectAccountMutation,
    useGetYouTubeAuthUrlQuery,
    useLazyGetYouTubeAuthUrlQuery,
    useSaveYouTubeAccountMutation,
    useGetYouTubeChannelQuery,
    useDisconnectYouTubeMutation,
    useValidateYouTubeVideoMutation,
    useScheduleYouTubePostMutation,
    useGetYouTubeQuotaMetricsQuery,
    useGetYouTubeAnalyticsQuery,
} = socialAccountApiSlice;
