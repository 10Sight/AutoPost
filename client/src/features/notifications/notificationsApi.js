import { apiSlice } from "../../app/api";

export const notificationsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query({
            query: () => ({
                url: "/notifications",
            }),
            providesTags: ["Notification"],
        }),
        markAsRead: builder.mutation({
            query: (notificationId) => ({
                url: `/notifications/${notificationId}`,
                method: "PATCH",
            }),
            invalidatesTags: ["Notification"],
        }),
        markAllAsRead: builder.mutation({
            query: () => ({
                url: "/notifications/mark-all-read",
                method: "PATCH",
            }),
            invalidatesTags: ["Notification"],
        }),
        deleteNotification: builder.mutation({
            query: (notificationId) => ({
                url: `/notifications/${notificationId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Notification"],
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
} = notificationsApi;
