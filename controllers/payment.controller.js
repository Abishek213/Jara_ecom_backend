// import dotenv from 'dotenv';
// dotenv.config();

// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// // Create Checkout Session
// export const createCheckoutSession = async (req, res) => {
//   const { items } = req.body;

//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment',
//       line_items: items.map(item => ({
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: item.name,
//           },
//           unit_amount: item.price * 100, // USD cents
//         },
//         quantity: item.quantity,
//       })),
//       success_url: `${process.env.CLIENT_URL}/success`,
//       cancel_url: `${process.env.CLIENT_URL}/cancel`,
//     });

//     res.status(200).json({ url: session.url });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Stripe Webhook
// export const stripeWebhook = async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.error(`Webhook error: ${err.message}`);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   // Handle event types
//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object;
//     console.log('💰 Payment was successful:', session);

//     try {
//       await create({
//         userId: session.metadata?.userId || null, // optional
//         email: session.customer_details.email,
//         paymentIntentId: session.payment_intent,
//         amount: session.amount_total,
//         currency: session.currency,
//         status: 'paid',
//       });
//       console.log(`✅ Order saved for: ${session.customer_details.email}`);
//     }
//     catch (error) {
//       console.error('❌ Error saving order:', error.message);
//     }
//   }

//   res.status(200).json({ received: true });
// };

import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { 
  verifyFonepayPayment,
  verifyStripePayment
} from '../services/payment.service.js';
import { successResponse } from '../utils/responseHandler.js';
import { 
  NotFoundError, 
  BadRequestError,
  UnauthorizedError 
} from '../utils/errors.js';
import { PAYMENT_METHODS } from '../enums/paymentMethods.enum.js';

// @desc    Get available payment methods
// @route   GET /api/payment/methods
// @access  Private
export const getPaymentMethods = async (req, res, next) => {
  const methods = [
    {
      code: PAYMENT_METHODS.FONEPAY,
      name: 'Fonepay',
      description: 'Pay via Fonepay (Nepali payment gateway)',
      available: true
    },
    {
      code: PAYMENT_METHODS.STRIPE,
      name: 'Credit/Debit Card',
      description: 'Pay via Visa, Mastercard or other cards',
      available: true
    },
    {
      code: PAYMENT_METHODS.COD,
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      available: true
    }
  ];

  successResponse(res, methods);
};

// @desc    Initiate payment
// @route   POST /api/payment/initiate
// @access  Private
export const initiatePayment = async (req, res, next) => {
  const { order_id, payment_method } = req.body;

  const order = await Order.findById(order_id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order
  if (order.user_id.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError('Not authorized to pay for this order');
  }

  // Check if order is already paid
  if (order.payment_status === 'paid') {
    throw new BadRequestError('Order is already paid');
  }

  let paymentResult;

  if (payment_method === PAYMENT_METHODS.FONEPAY) {
    paymentResult = await initiateFonepayPayment(order, req.user);
  } else if (payment_method === PAYMENT_METHODS.STRIPE) {
    paymentResult = await initiateStripePayment(order, req.user);
  } else if (payment_method === PAYMENT_METHODS.COD) {
    // For COD, just create a pending payment record
    await Payment.create({
      order_id: order._id,
      user_id: req.user._id,
      method: PAYMENT_METHODS.COD,
      amount: order.order_total,
      status: 'initiated'
    });

    paymentResult = { message: 'COD payment initiated' };
  } else {
    throw new BadRequestError('Invalid payment method');
  }

  successResponse(res, paymentResult);
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  const { order_id, payment_method, payment_data } = req.body;

  const order = await Order.findById(order_id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order
  if (order.user_id.toString() !== req.user._id.toString()) {
    throw new UnauthorizedError('Not authorized to verify payment for this order');
  }

  // Check if order is already paid
  if (order.payment_status === 'paid') {
    throw new BadRequestError('Order is already paid');
  }

  let isVerified = false;

  if (payment_method === PAYMENT_METHODS.FONEPAY) {
    isVerified = await verifyFonepayPayment(payment_data);
  } else if (payment_method === PAYMENT_METHODS.STRIPE) {
    isVerified = await verifyStripePayment(payment_data.paymentIntentId);
  } else if (payment_method === PAYMENT_METHODS.COD) {
    isVerified = true; // COD is always "verified" as we trust the delivery person
  }

  if (!isVerified) {
    throw new BadRequestError('Payment verification failed');
  }

  // Update payment status
  order.payment_status = 'paid';
  await order.save();

  // Create payment record
  const payment = await Payment.create({
    order_id: order._id,
    user_id: req.user._id,
    method: payment_method,
    amount: order.order_total,
    status: 'success',
    gateway_transaction_id: payment_data.transactionId || null
  });

  // Update order with payment reference
  order.payment_id = payment._id;
  await order.save();

  successResponse(res, { verified: true, order });
};

// @desc    Get payment details
// @route   GET /api/payment/:id
// @access  Private
export const getPaymentDetails = async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('order_id')
    .populate('user_id', 'name email');

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Check if user owns the payment
  if (
    payment.user_id._id.toString() !== req.user._id.toString() && 
    req.user.user_type !== 'admin'
  ) {
    throw new UnauthorizedError('Not authorized to access this payment');
  }

  successResponse(res, payment);
};