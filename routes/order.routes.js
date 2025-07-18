import express from 'express';
import {
  createOrder,
  getOrder,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
  returnOrder,
} from '../controllers/order.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { restrictTo } from '../middlewares/role.middleware.js';
import {
  validateCreateOrderInput,
  validateUpdateOrderStatusInput,
  validateReturnOrderInput,
} from '../validations/order.validation.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = express.Router();

// Apply authentication to all order routes
router.use(authenticateUser);

// Customer routes
router.post('/', validateRequest(validateCreateOrderInput), createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/return', validateRequest(validateReturnOrderInput), returnOrder);

// Admin routes
router.use(restrictTo('admin', 'order_manager'));
router.put('/:id/status', validateRequest(validateUpdateOrderStatusInput), updateOrderStatus);

export default router;