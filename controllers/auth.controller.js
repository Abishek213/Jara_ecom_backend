import User from '../models/User.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { successResponse } from '../utils/responseHandler.js';
import { BadRequestError, UnauthenticatedError } from '../utils/errors.js';
import { USER_ROLES } from '../enums/roles.enum.js';
import crypto from 'crypto';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const { name, email, phone, password, user_type } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    throw new BadRequestError('User with this email or phone already exists');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password_hash: password,
    user_type: user_type || USER_ROLES.CUSTOMER
  });

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  await sendWelcomeEmail(user, verificationToken);

  const token = user.getSignedJwtToken();
  user.password_hash = undefined;
  user.email_verification_token = undefined;
  user.email_verification_expires = undefined;

  successResponse(res, { token, user }, 201);
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password_hash');
  if (!user) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw new UnauthenticatedError('Account is suspended. Please contact support.');
  }

  const token = user.getSignedJwtToken();
  user.password_hash = undefined;
  successResponse(res, { token, user });
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  successResponse(res, { message: 'Logged out successfully' });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    throw new BadRequestError('No user found with this email');
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);
    successResponse(res, { message: 'Password reset email sent' });
  } catch (err) {
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new BadRequestError('Email could not be sent');
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    password_reset_token: resetPasswordToken,
    password_reset_expires: { $gt: Date.now() },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired token');
  }

  user.password_hash = req.body.password;
  user.password_reset_token = undefined;
  user.password_reset_expires = undefined;
  await user.save();

  const token = user.getSignedJwtToken();
  successResponse(res, { token });
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password_hash');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    throw new UnauthenticatedError('Current password is incorrect');
  }

  user.password_hash = req.body.newPassword;
  await user.save();

  const token = user.getSignedJwtToken();
  successResponse(res, { token });
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    email_verification_token: emailVerificationToken,
    email_verification_expires: { $gt: Date.now() },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired token');
  }

  user.email_verified = true;
  user.email_verification_token = undefined;
  user.email_verification_expires = undefined;
  await user.save({ validateBeforeSave: false });

  const token = user.getSignedJwtToken();
  successResponse(res, { token, user });
};

// @desc    Social auth callback
// @route   GET /api/auth/social/:provider/callback
// @access  Public
const socialAuthCallback = async (req, res, next) => {
  const { provider } = req.params;
  const { id, name, email } = req.user;

  let user = await User.findOne({ [`social_auth.${provider}_id`]: id });

  if (!user) {
    user = await User.create({
      name,
      email,
      password_hash: crypto.randomBytes(20).toString('hex'),
      social_auth: { [`${provider}_id`]: id },
      email_verified: true
    });
  }

  const token = user.getSignedJwtToken();
  successResponse(res, { token, user });
};

export default {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  socialAuthCallback
};