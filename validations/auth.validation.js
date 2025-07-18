import Joi from 'joi';

export const validateRegisterInput = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(8).required(),
  user_type: Joi.string().valid('customer', 'vendor').required(),
});

export const validateLoginInput = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const validateForgotPasswordInput = Joi.object({
  email: Joi.string().email().required(),
});

export const validateResetPasswordInput = Joi.object({
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

export const validateUpdatePasswordInput = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});