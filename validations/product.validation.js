import Joi from 'joi';

export const validateCreateProductInput = Joi.object({
  name: Joi.string().required(),
  brand: Joi.string().required(),
  description: Joi.string().required(),
  product_type: Joi.string().valid('standard', 'factory').required(),
  base_price: Joi.number().min(0).required(),
  discount_price: Joi.number().min(0).less(Joi.ref('base_price')),
  stock_qty: Joi.number().integer().min(0).required(),
categories: Joi.array().items(
    Joi.string().pattern(/^[0-9a-fA-F]{24}$/, 'MongoDB ObjectId')
  ).min(1).required(),
  sizes: Joi.array().items(Joi.string()),
  colors: Joi.array().items(Joi.string()),
  weight: Joi.number().min(0),
  dimensions: Joi.object({
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0),
  }),
  return_policy_days: Joi.number().integer().min(0),
});

export const validateUpdateProductInput = Joi.object({
  name: Joi.string(),
  brand: Joi.string(),
  description: Joi.string(),
  base_price: Joi.number().min(0),
  discount_price: Joi.number().min(0).less(Joi.ref('base_price')),
  stock_qty: Joi.number().integer().min(0),
  categories: Joi.array().items(Joi.string()).min(1),
  sizes: Joi.array().items(Joi.string()),
  colors: Joi.array().items(Joi.string()),
  is_featured: Joi.boolean(),
  is_available: Joi.boolean(),
  weight: Joi.number().min(0),
  dimensions: Joi.object({
    length: Joi.number().min(0),
    width: Joi.number().min(0),
    height: Joi.number().min(0),
  }),
  return_policy_days: Joi.number().integer().min(0),
});