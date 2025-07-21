import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllOrders,
  getOrderAnalytics,
  getProductAnalytics,
  getUserAnalytics,
  createAdmin,
  getAdmins,
  updateAdminRole,
  deleteAdmin,
} from '../controllers/admin.controller.js';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles('superadmin', 'product_manager', 'order_manager'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics/orders', getOrderAnalytics);
router.get('/analytics/products', getProductAnalytics);
router.get('/analytics/users', getUserAnalytics);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

// Order management
router.get('/orders', getAllOrders);

// Admin management (superadmin only)
router.use(authorizeRoles('superadmin'));
router.post('/admins', createAdmin);
router.get('/admins', getAdmins);
router.put('/admins/:id/role', updateAdminRole);
router.delete('/admins/:id', deleteAdmin);

export default router;