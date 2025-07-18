import axios from 'axios';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';
import Payment from '../models/Payment.js';

export const initiateFonepayPayment = async (order, user) => {
  try {
    const fonepayParams = {
      PID: process.env.FONEPAY_PID,
      MD: 'P',
      AMT: order.order_total,
      CRN: order._id.toString(),
      DT: new Date().toISOString(),
      R1: 'JaraEcommerce',
      R2: user.email,
      DV: process.env.FONEPAY_DV,
      PRN: `JARA-${Date.now()}`,
      RU: process.env.FONEPAY_RETURN_URL,
    };

    const response = await axios.post(process.env.FONEPAY_URL, fonepayParams);
    return response.data;
  } catch (error) {
    logger.error('Fonepay initiation error:', error);
    throw new BadRequestError('Payment initiation failed');
  }
};

export const verifyFonepayPayment = async (query) => {
  try {
    const verificationParams = {
      PID: process.env.FONEPAY_PID,
      BID: query.BID,
      AMT: query.AMT,
      MD: 'V',
      DV: process.env.FONEPAY_DV,
    };

    const response = await axios.post(process.env.FONEPAY_VERIFY_URL, verificationParams);
    return response.data;
  } catch (error) {
    logger.error('Fonepay verification error:', error);
    throw new BadRequestError('Payment verification failed');
  }
};

export const initiateStripePayment = async (order, user) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.order_total * 100,
      currency: 'npr',
      metadata: {
        order_id: order._id.toString(),
        user_id: user._id.toString(),
      },
    });

    return {
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    };
  } catch (error) {
    logger.error('Stripe payment error:', error);
    throw new BadRequestError('Stripe payment initiation failed');
  }
};

export const verifyStripePayment = async (paymentIntentId) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    logger.error('Stripe verification error:', error);
    throw new BadRequestError('Payment verification failed');
  }
};