import Joi from 'joi';
import { PAYMENT_METHODS } from '../enums/paymentMethods.enum.js';

export const validateInitiatePaymentInput = Joi.object({
  order_id: Joi.string().hex().length(24).required(),
  payment_method: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .required()
});

export const validateVerifyPaymentInput = Joi.object({
  order_id: Joi.string().hex().length(24).required(),
  payment_method: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .required(),
  payment_data: Joi.object({
    transactionId: Joi.string().when('payment_method', {
      is: PAYMENT_METHODS.FONEPAY,
      then: Joi.string().required()
    }),
    paymentIntentId: Joi.string().when('payment_method', {
      is: PAYMENT_METHODS.STRIPE,
      then: Joi.string().required()
    })
  }).required()
});

export const validatePaymentMethodInput = Joi.object({
  amount: Joi.number().min(1).required(),
  currency: Joi.string().default('NPR')
});