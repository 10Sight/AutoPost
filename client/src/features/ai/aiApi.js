import { apiSlice } from "../../app/api";

export const aiApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        generateText: builder.mutation({
            query: ({ model, ...data }) => ({
                url: "/ai/generate-text",
                method: "POST",
                data: { ...data, model },
            }),
        }),
        generateImage: builder.mutation({
            query: (data) => ({
                url: "/ai/generate-image",
                method: "POST",
                data,
            }),
        }),
        generateVideo: builder.mutation({
            query: (data) => ({
                url: "/ai/generate-video",
                method: "POST",
                data,
            }),
        }),
        getJobStatus: builder.query({
            query: (jobId) => ({
                url: `/ai/jobs/${jobId}`,
                method: "GET",
            }),
        }),
    }),
});

export const {
    useGenerateTextMutation,
    useGenerateImageMutation,
    useGenerateVideoMutation,
    useLazyGetJobStatusQuery,
} = aiApiSlice;
