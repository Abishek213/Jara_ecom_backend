import Joi from 'joi';

export const validateCreatePromoInput = Joi.object({
  code: Joi.string().required().uppercase().trim(),
  discount_type: Joi.string().valid('percentage', 'fixed').required(),
  discount_value: Joi.number().min(1).required(),
  min_order_amount: Joi.number().min(0),
  valid_from: Joi.date().iso().required(),
  valid_until: Joi.date().iso().min(Joi.ref('valid_from')).required(),
  is_active: Joi.boolean().default(true)
});

export const validateUpdatePromoInput = Joi.object({
  code: Joi.string().uppercase().trim(),
  discount_type: Joi.string().valid('percentage', 'fixed'),
  discount_value: Joi.number().min(1),
  min_order_amount: Joi.number().min(0),
  valid_from: Joi.date().iso(),
  valid_until: Joi.date().iso().min(Joi.ref('valid_from')),
  is_active: Joi.boolean()
});

export const validatePromoCodeInput = Joi.object({
  code: Joi.string().required().uppercase().trim(),
  order_amount: Joi.number().min(0)
});