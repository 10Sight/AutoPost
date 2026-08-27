import { apiSlice } from "../../app/api";

export const organizationApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getOrganization: builder.query({
            query: () => ({
                url: "/organization",
            }),
            providesTags: ["Organization"],
        }),
        getPublicOrganization: builder.query({
            query: (slug) => ({
                url: "/organization/public",
                headers: slug ? { "x-tenant-slug": slug } : {},
            }),
            providesTags: ["Organization"],
        }),
        updateOrganization: builder.mutation({
            query: (data) => ({
                url: "/organization",
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["Organization"],
        }),
        getAiKeys: builder.query({
            query: () => ({
                url: "/organization/ai-keys",
            }),
            providesTags: ["AiKeys"],
        }),
        updateAiKeys: builder.mutation({
            query: (data) => ({
                url: "/organization/ai-keys",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["AiKeys"],
        }),
        getGeminiOAuthUrl: builder.query({
            query: () => ({
                url: "/organization/oauth/gemini/auth",
            }),
        }),
        disconnectGeminiOAuth: builder.mutation({
            query: () => ({
                url: "/organization/oauth/gemini/disconnect",
                method: "POST",
            }),
            invalidatesTags: ["AiKeys"],
        }),
        updateGeminiProjectId: builder.mutation({
            query: (projectId) => ({
                url: "/organization/oauth/gemini/project",
                method: "PUT",
                body: { projectId },
            }),
            invalidatesTags: ["AiKeys"],
        }),
        createStripeCheckout: builder.mutation({
            query: (data) => ({
                url: "/billing/stripe/create-session",
                method: "POST",
                body: data,
            }),
        }),
        getBillingStatus: builder.query({
            query: () => ({
                url: "/billing/status",
            }),
            providesTags: ["Billing"],
        }),
        createRazorpayOrder: builder.mutation({
            query: (data) => ({
                url: "/billing/razorpay/create-order",
                method: "POST",
                body: data,
            }),
        }),
        verifyRazorpayPayment: builder.mutation({
            query: (paymentData) => ({
                url: "/billing/razorpay/verify",
                method: "POST",
                body: paymentData,
            }),
            invalidatesTags: ["Billing", "Organization"],
        }),
        cancelSubscription: builder.mutation({
            query: () => ({
                url: "/billing/cancel",
                method: "POST",
            }),
            invalidatesTags: ["Billing"],
        }),
        updateBillingDetails: builder.mutation({
            query: (data) => ({
                url: "/billing/update-details",
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["Billing"],
        }),
    }),
});

export const {
    useGetOrganizationQuery,
    useUpdateOrganizationMutation,
    useGetPublicOrganizationQuery,
    useCreateStripeCheckoutMutation,
    useGetBillingStatusQuery,
    useCreateRazorpayOrderMutation,
    useVerifyRazorpayPaymentMutation,
    useCancelSubscriptionMutation,
    useUpdateBillingDetailsMutation,
    useGetAiKeysQuery,
    useUpdateAiKeysMutation,
    useLazyGetGeminiOAuthUrlQuery,
    useDisconnectGeminiOAuthMutation,
    useUpdateGeminiProjectIdMutation,
} = organizationApiSlice;
