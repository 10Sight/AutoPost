import { apiSlice } from "../../app/api";

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials,
            }),
            invalidatesTags: ["User"],
        }),
        register: builder.mutation({
            query: (userData) => ({
                url: "/auth/register",
                method: "POST",
                body: userData,
            }),
        }),
        logout: builder.mutation({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
            }),
            invalidatesTags: ["User", "SocialAccount", "Media", "ScheduledPost"],
        }),
        createUser: builder.mutation({
            query: (userData) => ({
                url: "/users",
                method: "POST",
                body: userData,
            }),
            invalidatesTags: ["User"],
        }),
        getCurrentUser: builder.query({
            query: () => ({
                url: "/users/current-user",
            }),
            providesTags: ["User"],
        }),
        getAllUsers: builder.query({
            query: () => ({
                url: "/users",
            }),
            providesTags: ["User"],
        }),
        changePassword: builder.mutation({
            query: (data) => ({
                url: "/users/change-password",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["User"],
        }),
        updateProfile: builder.mutation({
            query: (data) => ({
                url: "/users/update-account",
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["User"],
        }),
        updateUserRole: builder.mutation({
            query: ({ userId, role }) => ({
                url: "/users/role",
                method: "PATCH",
                body: { userId, role },
            }),
            invalidatesTags: ["User"],
        }),
        deleteUser: builder.mutation({
            query: (userId) => ({
                url: `/users/${userId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["User"],
        }),
    }),
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
    useGetAllUsersQuery,
    useCreateUserMutation,
    useChangePasswordMutation,
    useUpdateProfileMutation,
    useUpdateUserRoleMutation,
    useDeleteUserMutation,
} = authApiSlice;
