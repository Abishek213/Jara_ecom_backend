// import express from 'express';
// import {
//   createCheckoutSession,
//   stripeWebhook,
// } from '../controller/paymentController.js';

// const router = express.Router();

// router.post('/create-checkout-session', createCheckoutSession);

// // Webhook route requires raw body
// router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// export default router;

import express from 'express';
import {
  initiatePayment,
  verifyPayment,
  getPaymentMethods,
  getPaymentDetails,
} from '../controllers/payment.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import {
  validateInitiatePaymentInput,
  validateVerifyPaymentInput,
} from '../validations/payment.validation.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = express.Router();

// Apply authentication to all payment routes
router.use(authenticateUser);

// Payment routes
router.get('/methods', getPaymentMethods);
router.post('/initiate', validateRequest(validateInitiatePaymentInput), initiatePayment);
router.post('/verify', validateRequest(validateVerifyPaymentInput), verifyPayment);
router.get('/:id', getPaymentDetails);

export default router;