import { Router } from "express";
import { createRazorpayOrder, verifyPayment, razorpayWebhook, createStripeCheckout, stripeWebhook } from "../controllers/billing.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { tenantMiddleware } from "../middlewares/tenant.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

// Webhook is public (verification inside controller)
router.post("/webhook", razorpayWebhook);

// Protected routes
router.use(verifyJWT);
router.use(tenantMiddleware);
router.use(authorizeRoles("admin", "superadmin"));

router.post("/create-order", createRazorpayOrder);
router.post("/verify-payment", verifyPayment);
router.post("/stripe-checkout", createStripeCheckout);

export default router;
