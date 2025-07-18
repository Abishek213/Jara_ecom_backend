import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

export const getSalesAnalytics = async (timeRange = 'monthly') => {
  try {
    let groupBy, dateFormat;
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'daily':
        startDate = new Date(now.setDate(now.getDate() - 30));
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 90));
        groupBy = { $dateToString: { format: '%Y-%U', date: '$created_at' } };
        dateFormat = '%Y-%U';
        break;
      case 'monthly':
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 12));
        groupBy = { $dateToString: { format: '%Y-%m', date: '$created_at' } };
        dateFormat = '%Y-%m';
        break;
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          created_at: { $gte: startDate },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$order_total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$order_total' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      timeRange,
      dateFormat,
      salesData,
    };
  } catch (error) {
    logger.error('Sales analytics error:', error);
    throw error;
  }
};

export const getProductPerformance = async (limit = 5) => {
  try {
    const topProducts = await Order.aggregate([
      {
        $unwind: '$order_items',
      },
      {
        $group: {
          _id: '$order_items.product_id',
          totalQuantity: { $sum: '$order_items.quantity' },
          totalRevenue: { $sum: '$order_items.total' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: '$product',
      },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          productImage: { $arrayElemAt: ['$product.images', 0] },
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    return topProducts;
  } catch (error) {
    logger.error('Product performance analytics error:', error);
    throw error;
  }
};

export const getUserAnalytics = async () => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$user_type',
          count: { $sum: 1 },
        },
      },
    ]);

    const newUsers = await User.aggregate([
      {
        $match: {
          created_at: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      userStats,
      newUsers,
    };
  } catch (error) {
    logger.error('User analytics error:', error);
    throw error;
  }
};