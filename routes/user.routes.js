import express from 'express';
import {
  getMe,
  updateProfile,
  deleteAccount,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/user.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import {
  validateUpdateProfileInput,
  validateAddressInput,
} from '../validations/user.validation.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/me', getMe);
router.put('/profile', validateRequest(validateUpdateProfileInput), updateProfile);
router.delete('/delete', deleteAccount);

router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

router.post('/addresses', validateRequest(validateAddressInput), addAddress);
router.put('/addresses/:addressId', validateRequest(validateAddressInput), updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

export default router;