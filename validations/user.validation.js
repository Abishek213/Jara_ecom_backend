import Joi from 'joi';

export const validateRegisterInput = Joi.object({
  name: Joi.string().required().min(3).max(30),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(8).required(),
  user_type: Joi.string().valid('customer', 'vendor', 'admin')
});

export const validateLoginInput = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const validateUpdateProfileInput = Joi.object({
  name: Joi.string().min(3).max(30),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9]{10}$/)
});

export const validateAddressInput = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().pattern(/^[0-9]{5}$/),
  isDefault: Joi.boolean()
});