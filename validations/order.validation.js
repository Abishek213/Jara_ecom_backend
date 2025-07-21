import Joi from 'joi';

export const validateCreateOrderInput = Joi.object({
  shipping_address: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    province: Joi.string().required(),
    phone: Joi.string().required(),
    isDefault: Joi.boolean(),
  }).required(),
  billing_address: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    province: Joi.string().required(),
    phone: Joi.string().required(),
  }).required(),
  payment_method: Joi.string().valid('fonepay', 'stripe', 'cod').required(),
  promo_code: Joi.string().allow(''),
});

export const validateUpdateOrderStatusInput = Joi.object({
  status: Joi.string()
    .valid('confirmed', 'shipped', 'delivered', 'cancelled')
    .required(),
  shipping_provider: Joi.string().when('status', {
    is: 'shipped',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  shipping_tracking_id: Joi.string().when('status', {
    is: 'shipped',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
});

export const validateReturnOrderInput = Joi.object({
  reason: Joi.string().required(),
  items: Joi.array().items(Joi.string()).min(1).required(),
});