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
        createRazorpayOrder: builder.mutation({
            query: (plan) => ({
                url: "/billing/create-order",
                method: "POST",
                body: { plan },
            }),
        }),
        createStripeCheckout: builder.mutation({
            query: (plan) => ({
                url: "/billing/stripe-checkout",
                method: "POST",
                body: { plan },
            }),
        }),
        verifyRazorpayPayment: builder.mutation({
            query: (paymentData) => ({
                url: "/billing/verify-payment",
                method: "POST",
                body: paymentData,
            }),
            invalidatesTags: ["Organization"],
        }),
    }),
});

export const { useGetOrganizationQuery, useUpdateOrganizationMutation, useGetPublicOrganizationQuery, useCreateRazorpayOrderMutation, useVerifyRazorpayPaymentMutation, useCreateStripeCheckoutMutation } = organizationApiSlice;
