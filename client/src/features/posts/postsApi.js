import { apiSlice } from "../../app/api";

export const scheduledPostApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getScheduledPosts: builder.query({
            query: ({ page = 1, limit = 10, status, socialAccountId, groupId, platform, search, startDate, endDate } = {}) => ({
                url: "/scheduled-posts",
                params: { page, limit, status, socialAccountId, groupId, platform, search, startDate, endDate },
            }),
            providesTags: ["ScheduledPost"],
        }),
        createScheduledPost: builder.mutation({
            query: (postData) => ({
                url: "/scheduled-posts",
                method: "POST",
                data: postData,
            }),
            invalidatesTags: ["ScheduledPost"],
        }),
        getDashboardStats: builder.query({
            query: ({ groupId } = {}) => ({
                url: "/scheduled-posts/stats",
                params: { groupId },
            }),
            providesTags: ["ScheduledPost"],
        }),
        deleteScheduledPost: builder.mutation({
            query: (postId) => ({
                url: `/scheduled-posts/${postId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ScheduledPost"],
        }),
        getAnalytics: builder.query({
            query: ({ days = 30, groupId } = {}) => ({
                url: "/scheduled-posts/analytics",
                params: { days, groupId }
            }),
            providesTags: ["ScheduledPost"],
        }),
        getSmartSuggestions: builder.query({
            query: ({ platform } = {}) => ({
                url: "/scheduled-posts/suggestions",
                params: { platform },
            }),
        }),
        getAccountStats: builder.query({
            query: (accountId) => ({
                url: `/scheduled-posts/account/${accountId}/stats`,
            }),
            providesTags: ["ScheduledPost"],
        }),
        bulkCreateScheduledPosts: builder.mutation({
            query: (formData) => ({
                url: "/scheduled-posts/bulk",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["ScheduledPost", "DashboardStats", "Analytics"],
        }),
        updatePostStatus: builder.mutation({
            query: ({ postId, status, comment }) => ({
                url: `/scheduled-posts/${postId}/status`,
                method: "PATCH",
                body: { status, comment },
            }),
            invalidatesTags: ["ScheduledPost", "DashboardStats"],
        }),
        getPostVersions: builder.query({
            query: (postId) => ({
                url: `/scheduled-posts/${postId}/versions`,
            }),
            providesTags: (result, error, postId) => [{ type: "PostVersion", id: postId }],
        }),
        rollbackPostVersion: builder.mutation({
            query: ({ postId, versionNumber }) => ({
                url: `/scheduled-posts/${postId}/versions/${versionNumber}/rollback`,
                method: "POST",
            }),
            invalidatesTags: (result, error, { postId }) => ["ScheduledPost", { type: "PostVersion", id: postId }],
        }),
        updateScheduledPost: builder.mutation({
            query: ({ postId, ...postData }) => ({
                url: `/scheduled-posts/${postId}`,
                method: "PATCH",
                body: postData,
            }),
            invalidatesTags: (result, error, { postId }) => ["ScheduledPost", { type: "PostVersion", id: postId }],
        }),
        getPostById: builder.query({
            query: (postId) => ({
                url: `/scheduled-posts/${postId}`,
            }),
            providesTags: (result, error, postId) => [{ type: "ScheduledPost", id: postId }],
        }),
    }),
});

export const {
    useGetScheduledPostsQuery,
    useCreateScheduledPostMutation,
    useDeleteScheduledPostMutation,
    useGetDashboardStatsQuery,
    useGetAnalyticsQuery,
    useGetSmartSuggestionsQuery,
    useGetAccountStatsQuery,
    useBulkCreateScheduledPostsMutation,
    useUpdatePostStatusMutation,
    useGetPostVersionsQuery,
    useRollbackPostVersionMutation,
    useUpdateScheduledPostMutation,
    useGetPostByIdQuery,
} = scheduledPostApiSlice;
