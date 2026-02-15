import { apiSlice } from "../../app/api";

export const mediaApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMedia: builder.query({
            query: ({ page = 1, limit = 20, type } = {}) => ({
                url: "/media",
                params: { page, limit, type },
            }),
            providesTags: ["Media"],
        }),
        uploadMedia: builder.mutation({
            query: (formData) => ({
                url: "/media/upload",
                method: "POST",
                data: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }),
            invalidatesTags: ["Media"],
        }),
        deleteMedia: builder.mutation({
            query: (mediaId) => ({
                url: `/media/${mediaId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Media"],
        }),
    }),
});

export const {
    useGetMediaQuery,
    useUploadMediaMutation,
    useDeleteMediaMutation,
} = mediaApiSlice;
