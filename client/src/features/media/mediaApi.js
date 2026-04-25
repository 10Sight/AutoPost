import { apiSlice } from "../../app/api";

export const mediaApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMedia: builder.query({
            query: ({ page = 1, limit = 20, type, folderId, groupId } = {}) => ({
                url: "/media",
                params: { page, limit, type, folderId, groupId },
            }),
            providesTags: ["Media"],
        }),
        getMediaById: builder.query({
            query: (mediaId) => ({
                url: (!mediaId || mediaId === "undefined") ? "/invalid-media" : `/media/${mediaId}`
            }),
            providesTags: (result, error, id) => [{ type: "Media", id }],
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
        saveEditedMedia: builder.mutation({
            query: (formData) => ({
                url: "/media/editor/upload",
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
        getFolders: builder.query({
            query: ({ groupId } = {}) => ({ 
                url: "/media/folders",
                params: { groupId }
            }),
            providesTags: ["MediaFolder"],
        }),
        createFolder: builder.mutation({
            query: (data) => ({
                url: "/media/folders",
                method: "POST",
                data,
            }),
            invalidatesTags: ["MediaFolder"],
        }),
        deleteFolder: builder.mutation({
            query: (folderId) => ({
                url: `/media/folders/${folderId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["MediaFolder", "Media"],
        }),
        moveMedia: builder.mutation({
            query: ({ mediaId, folderId }) => ({
                url: `/media/${mediaId}/move`,
                method: "PUT",
                data: { folderId },
            }),
            invalidatesTags: ["Media"],
        }),
    }),
});

export const {
    useGetMediaQuery,
    useGetMediaByIdQuery,
    useUploadMediaMutation,
    useSaveEditedMediaMutation,
    useDeleteMediaMutation,
    useGetFoldersQuery,
    useCreateFolderMutation,
    useDeleteFolderMutation,
    useMoveMediaMutation,
} = mediaApiSlice;
