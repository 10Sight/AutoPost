import { Router } from "express";
import { 
    createStripeSession, 
    handleStripeWebhook, 
    getBillingStatus,
    createRazorpayOrder,
    verifyRazorpayPayment,
    downloadInvoice,
    cancelSubscription,
    updateBillingDetails
} from "../controllers/billing.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import express from "express";

const router = Router();

// Protected routes
router.use(verifyJWT);
router.use(tenantMiddleware);

router.get("/status", getBillingStatus);

// Only Admins can create sessions
router.post(
    "/stripe/create-session", 
    authorizeRoles("admin", "superadmin"), 
    createStripeSession
);

router.post(
    "/razorpay/create-order",
    authorizeRoles("admin", "superadmin"),
    createRazorpayOrder
);

router.post(
    "/razorpay/verify",
    authorizeRoles("admin", "superadmin"),
    verifyRazorpayPayment
);

router.get(
    "/invoice/:invoiceId/download",
    authorizeRoles("admin", "superadmin"),
    downloadInvoice
);

router.post(
    "/cancel",
    authorizeRoles("admin", "superadmin"),
    cancelSubscription
);

router.patch(
    "/update-details",
    authorizeRoles("admin", "superadmin"),
    updateBillingDetails
);

export default router;
