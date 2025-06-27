import express from 'express';
import {
  createCheckoutSession,
  stripeWebhook,
} from '../controller/paymentController.js';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);

// Webhook route requires raw body
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
