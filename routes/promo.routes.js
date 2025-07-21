import express from 'express';
import {
  createPromoCode,
  getPromoCodes,
  getPromoCode,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
} from '../controllers/promo.controller.js';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.middleware.js';
import {
  validateCreatePromoInput,
  validateUpdatePromoInput,
  validatePromoCodeInput,
} from '../validations/promo.validation.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = express.Router();

// Public route for promo code validation
router.post('/validate', validateRequest(validatePromoCodeInput), validatePromoCode);

// Protected admin routes
router.use(authenticateUser);
router.use(authorizeRoles('admin'));

router.post('/', validateRequest(validateCreatePromoInput), createPromoCode);
router.get('/', getPromoCodes);
router.get('/:id', getPromoCode);
router.put('/:id', validateRequest(validateUpdatePromoInput), updatePromoCode);
router.delete('/:id', deletePromoCode);

export default router;