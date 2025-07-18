import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  getProductsByCategory,
  searchProducts,
} from '../controllers/product.controller.js';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.middleware.js';
import { uploadMultipleImages } from '../middlewares/upload.middleware.js';
import {
  validateCreateProductInput,
  validateUpdateProductInput,
} from '../validations/product.validation.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);
router.get('/category/:categoryId', getProductsByCategory);

// Protected routes
router.use(authenticateUser);

router.post(
  '/',
  authorizeRoles('admin', 'vendor'),
  validateRequest(validateCreateProductInput),
  createProduct
);

router.put(
  '/:id',
  authorizeRoles('admin', 'vendor'),
  validateRequest(validateUpdateProductInput),
  updateProduct
);

router.delete('/:id', authorizeRoles('admin', 'vendor'), deleteProduct);

router.post(
  '/:id/images',
  authorizeRoles('admin', 'vendor'),
  uploadMultipleImages,
  uploadProductImages
);

router.delete(
  '/:id/images/:imageId',
  authorizeRoles('admin', 'vendor'),
  deleteProductImage
);

export default router;