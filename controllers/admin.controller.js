import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import { 
  getSalesAnalytics, 
  getProductPerformance,
  getUserAnalytics as getUserAnalyticsService  // Renamed import
} from '../services/analytics.service.js';
import { successResponse, paginatedResponse } from '../utils/responseHandler.js';
import { 
  NotFoundError, 
  BadRequestError,
  UnauthorizedError 
} from '../utils/errors.js';
import { USER_ROLES, ADMIN_ROLES } from '../enums/roles.enum.js';
import { APIFeatures } from '../utils/apiFeatures.js';

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getDashboardStats = async (req, res, next) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueStats,
    recentOrders,
    lowStockProducts
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      {
        $match: {
          status: { $nin: ['cancelled', 'returned'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$order_total' },
          avgOrderValue: { $avg: '$order_total' }
        }
      }
    ]),
    Order.find()
      .sort('-created_at')
      .limit(5)
      .populate('user_id', 'name email'),
    Product.find({ stock_qty: { $lt: 10 } })
      .sort('stock_qty')
      .limit(5)
      .select('name stock_qty images')
  ]);

  successResponse(res, {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue: revenueStats[0]?.totalRevenue || 0,
    avgOrderValue: revenueStats[0]?.avgOrderValue || 0,
    recentOrders,
    lowStockProducts
  });
};

// @desc    Get order analytics
// @route   GET /api/admin/analytics/orders
// @access  Private (Admin)
export const getOrderAnalytics = async (req, res, next) => {
  const { timeRange = 'monthly' } = req.query;
  const analytics = await getSalesAnalytics(timeRange);
  successResponse(res, analytics);
};

// @desc    Get product analytics
// @route   GET /api/admin/analytics/products
// @access  Private (Admin)
export const getProductAnalytics = async (req, res, next) => {
  const { limit = 5 } = req.query;
  const analytics = await getProductPerformance(limit);
  successResponse(res, analytics);
};

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private (Admin)
export const getUserAnalytics = async (req, res, next) => {
  const analytics = await getUserAnalyticsService();  // Using renamed import
  successResponse(res, analytics);
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;
  const total = await User.countDocuments(features.query._conditions);

  paginatedResponse(res, users, total, req.query.page, req.query.limit);
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = async (req, res, next) => {
  const { status } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent modifying admin users
  if (ADMIN_ROLES.includes(user.user_type)) {
    throw new UnauthorizedError('Cannot modify admin user status');
  }

  user.status = status;
  await user.save();

  successResponse(res, user);
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin)
export const getAllOrders = async (req, res, next) => {
  const features = new APIFeatures(
    Order.find().populate('user_id', 'name email'),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query;
  const total = await Order.countDocuments(features.query._conditions);

  paginatedResponse(res, orders, total, req.query.page, req.query.limit);
};

// @desc    Create admin
// @route   POST /api/admin/admins
// @access  Private (Superadmin)
export const createAdmin = async (req, res, next) => {
  const { name, email, role } = req.body;

  // Check if email already exists
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new BadRequestError('Admin with this email already exists');
  }

  const admin = await Admin.create({
    name,
    email,
    role
  });

  successResponse(res, admin, 201);
};

// @desc    Get all admins
// @route   GET /api/admin/admins
// @access  Private (Superadmin)
export const getAdmins = async (req, res, next) => {
  const admins = await Admin.find().select('-password_hash');
  successResponse(res, admins);
};

// @desc    Update admin role
// @route   PUT /api/admin/admins/:id/role
// @access  Private (Superadmin)
export const updateAdminRole = async (req, res, next) => {
  const { role } = req.body;
  const admin = await Admin.findById(req.params.id);

  if (!admin) {
    throw new NotFoundError('Admin not found');
  }

  admin.role = role;
  await admin.save();

  successResponse(res, admin);
};

// @desc    Delete admin
// @route   DELETE /api/admin/admins/:id
// @access  Private (Superadmin)
export const deleteAdmin = async (req, res, next) => {
  const admin = await Admin.findById(req.params.id);

  if (!admin) {
    throw new NotFoundError('Admin not found');
  }

  // Prevent deleting self
  if (admin._id.toString() === req.user._id.toString()) {
    throw new BadRequestError('Cannot delete your own admin account');
  }

  await admin.remove();

  successResponse(res, { message: 'Admin deleted successfully' });
};