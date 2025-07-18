import express from 'express';
import authController from '../controllers/auth.controller.js';
import {
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
  validateUpdatePasswordInput,
} from '../validations/auth.validation.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { authLimiter } from '../config/rateLimiter.js';

const router = express.Router();

// Fixed routes - middleware properly initialized with schemas
router.post('/register', validateRequest(validateRegisterInput), authController.register);
router.post('/login', authLimiter, validateRequest(validateLoginInput), authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', validateRequest(validateForgotPasswordInput), authController.forgotPassword);
router.put('/reset-password/:resetToken', validateRequest(validateResetPasswordInput), authController.resetPassword);
router.put('/update-password', validateRequest(validateUpdatePasswordInput), authController.updatePassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/social/:provider/callback', authController.socialAuthCallback);

export default router;