import Product from '../models/Product.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/errors.js';

export const searchProducts = async (query, filters = {}) => {
  try {
    const { q, category, brand, minPrice, maxPrice, inStock, sort } = query;

    // Base search query
    const searchQuery = {
      $and: [
        { is_available: true },
        ...(filters.is_featured ? [{ is_featured: true }] : []),
      ],
    };

    // Text search
    if (q) {
      searchQuery.$and.push({
        $text: { $search: q },
      });
    }

    // Category filter
    if (category) {
      searchQuery.$and.push({
        categories: { $in: [category] },
      });
    }

    // Brand filter
    if (brand) {
      searchQuery.$and.push({
        brand: { $regex: new RegExp(brand, 'i') },
      });
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      searchQuery.$and.push({
        $or: [
          { discount_price: priceFilter },
          { base_price: priceFilter },
        ],
      });
    }

    // Stock availability filter
    if (inStock === 'true') {
      searchQuery.$and.push({
        stock_qty: { $gt: 0 },
      });
    }

    // Sorting options
    let sortOption = { created_at: -1 };
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOption = { discount_price: 1, base_price: 1 };
          break;
        case 'price-desc':
          sortOption = { discount_price: -1, base_price: -1 };
          break;
        case 'rating':
          sortOption = { averageRating: -1 };
          break;
        case 'popular':
          sortOption = { wishlist_count: -1 };
          break;
      }
    }

    const products = await Product.find(searchQuery)
      .sort(sortOption)
      .populate('categories', 'name slug');

    return products;
  } catch (error) {
    logger.error('Product search error:', error);
    throw new BadRequestError('Failed to search products');
  }
};

export const indexProducts = async () => {
  try {
    await Product.createIndexes({
      name: 'text',
      description: 'text',
      brand: 'text',
      tags: 'text',
    });
    logger.info('Product search indexes created');
  } catch (error) {
    logger.error('Error creating product indexes:', error);
    throw new InternalServerError('Failed to create product search indexes');
  }
};