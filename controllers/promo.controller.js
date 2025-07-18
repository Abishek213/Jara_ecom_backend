import Promotion from '../models/Promotion.js';
import { successResponse } from '../utils/responseHandler.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

// @desc    Create promo code
// @route   POST /api/promos
// @access  Private (Admin)
export const createPromoCode = async (req, res, next) => {
  const { 
    code, 
    discount_type, 
    discount_value, 
    min_order_amount,
    valid_from,
    valid_until
  } = req.body;

  // Check if promo code already exists
  const existingPromo = await Promotion.findOne({ code });
  if (existingPromo) {
    throw new BadRequestError('Promo code already exists');
  }

  // Validate dates
  if (new Date(valid_from) >= new Date(valid_until)) {
    throw new BadRequestError('Valid until date must be after valid from date');
  }

  const promo = await Promotion.create({
    code,
    discount_type,
    discount_value,
    min_order_amount,
    valid_from,
    valid_until
  });

  successResponse(res, promo, 201);
};

// @desc    Get all promo codes
// @route   GET /api/promos
// @access  Private (Admin)
export const getPromoCodes = async (req, res, next) => {
  const promos = await Promotion.find().sort('-created_at');
  successResponse(res, promos);
};

// @desc    Get single promo code
// @route   GET /api/promos/:id
// @access  Private (Admin)
export const getPromoCode = async (req, res, next) => {
  const promo = await Promotion.findById(req.params.id);

  if (!promo) {
    throw new NotFoundError('Promo code not found');
  }

  successResponse(res, promo);
};

// @desc    Update promo code
// @route   PUT /api/promos/:id
// @access  Private (Admin)
export const updatePromoCode = async (req, res, next) => {
  const promo = await Promotion.findById(req.params.id);

  if (!promo) {
    throw new NotFoundError('Promo code not found');
  }

  // Validate dates if provided
  if (req.body.valid_from && req.body.valid_until) {
    if (new Date(req.body.valid_from) >= new Date(req.body.valid_until)) {
      throw new BadRequestError('Valid until date must be after valid from date');
    }
  }

  Object.assign(promo, req.body);
  await promo.save();

  successResponse(res, promo);
};

// @desc    Delete promo code
// @route   DELETE /api/promos/:id
// @access  Private (Admin)
export const deletePromoCode = async (req, res, next) => {
  const promo = await Promotion.findById(req.params.id);

  if (!promo) {
    throw new NotFoundError('Promo code not found');
  }

  await promo.remove();

  successResponse(res, { message: 'Promo code deleted successfully' });
};

// @desc    Validate promo code
// @route   POST /api/promos/validate
// @access  Public
export const validatePromoCode = async (req, res, next) => {
  const { code, order_amount } = req.body;

  const promo = await Promotion.findOne({ 
    code,
    is_active: true,
    valid_from: { $lte: new Date() },
    valid_until: { $gte: new Date() }
  });

  if (!promo) {
    throw new NotFoundError('Invalid or expired promo code');
  }

  if (promo.min_order_amount && order_amount < promo.min_order_amount) {
    throw new BadRequestError(
      `Minimum order amount of ${promo.min_order_amount} required for this promo code`
    );
  }

  successResponse(res, promo);
};