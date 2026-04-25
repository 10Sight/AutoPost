import { apiSlice } from "../../app/api";

export const engagementApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPostEngagement: builder.query({
            query: (postId) => ({
                url: `/engagement/${postId}`,
                method: "GET",
            }),
            providesTags: (result, error, postId) => [{ type: "Engagement", id: postId }],
        }),
        getPostComments: builder.query({
            query: (postId) => ({
                url: `/engagement/${postId}/comments`,
                method: "GET",
            }),
            providesTags: (result, error, postId) => [{ type: "Comments", id: postId }],
        }),
        addPostComment: builder.mutation({
            query: ({ postId, ...data }) => ({
                url: `/engagement/${postId}/comments`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { postId }) => [
                { type: "Comments", id: postId },
                { type: "Engagement", id: postId }
            ],
        }),
        likePostComment: builder.mutation({
            query: ({ postId, commentId, rating }) => ({
                url: `/engagement/${postId}/comments/${commentId}/like`,
                method: "POST",
                body: { rating },
            }),
            invalidatesTags: (result, error, { postId }) => [
                { type: "Comments", id: postId }
            ],
        }),
        likePost: builder.mutation({
            query: ({ postId, rating }) => ({
                url: `/engagement/${postId}/like`,
                method: "POST",
                body: { rating },
            }),
            invalidatesTags: (result, error, { postId }) => [
                { type: "Engagement", id: postId }
            ],
        }),
    }),
});

export const {
    useGetPostEngagementQuery,
    useGetPostCommentsQuery,
    useAddPostCommentMutation,
    useLikePostCommentMutation,
    useLikePostMutation,
} = engagementApiSlice;
