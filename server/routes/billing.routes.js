import express from "express";
import { 
  createCheckoutSession, 
  getBillingPortal, 
  stripeWebhook 
} from "../controllers/billing.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Webhook listener needs raw request payload to confirm signatures
router.post(
  "/webhook", 
  express.raw({ type: "application/json" }), 
  stripeWebhook
);

// Checkout and Portal (authenticated)
router.post("/checkout", verifyToken, createCheckoutSession);
router.post("/portal", verifyToken, getBillingPortal);

export default router;
