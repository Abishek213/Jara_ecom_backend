import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { successResponse, paginatedResponse } from '../utils/responseHandler.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { APIFeatures } from '../utils/apiFeatures.js';
import { USER_ROLES } from '../enums/roles.enum.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  const features = new APIFeatures(
    Product.find({ is_available: true }).populate('categories', 'name slug'),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;
  const total = await Product.countDocuments(features.query._conditions);

  paginatedResponse(res, products, total, req.query.page, req.query.limit);
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('categories', 'name slug')
    .populate('vendor_id', 'name email phone')
    .populate('reviews');

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  successResponse(res, product);
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin/Vendor)
export const createProduct = async (req, res, next) => {
  // Set vendor_id if user is vendor
  if (req.user.user_type === USER_ROLES.VENDOR) {
    req.body.vendor_id = req.user._id;
    req.body.product_type = 'factory';
  }

  // Check if categories exist
  const categories = await Category.find({ _id: { $in: req.body.categories } });
  if (categories.length !== req.body.categories.length) {
    throw new BadRequestError('One or more categories not found');
  }

  const product = await Product.create(req.body);

  successResponse(res, product, 201);
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin/Vendor)
export const updateProduct = async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if vendor owns the product
  if (
    req.user.user_type === USER_ROLES.VENDOR && 
    product.vendor_id.toString() !== req.user._id.toString()
  ) {
    throw new UnauthorizedError('Not authorized to update this product');
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  successResponse(res, product);
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin/Vendor)
export const deleteProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if vendor owns the product
  if (
    req.user.user_type === USER_ROLES.VENDOR && 
    product.vendor_id.toString() !== req.user._id.toString()
  ) {
    throw new UnauthorizedError('Not authorized to delete this product');
  }

  // Delete images from Cloudinary
  for (const image of product.images) {
    await deleteFromCloudinary(image.public_id);
  }

  await product.remove();

  successResponse(res, { message: 'Product deleted successfully' });
};

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private (Admin/Vendor)
export const uploadProductImages = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if vendor owns the product
  if (
    req.user.user_type === USER_ROLES.VENDOR && 
    product.vendor_id.toString() !== req.user._id.toString()
  ) {
    throw new UnauthorizedError('Not authorized to update this product');
  }

  if (!req.files || req.files.length === 0) {
    throw new BadRequestError('Please upload at least one image');
  }

  const uploadPromises = req.files.map(async (file) => {
    const result = await uploadToCloudinary(file.path, 'jara-products');
    return {
      public_id: result.public_id,
      url: result.secure_url,
      is_primary: product.images.length === 0 // Set first image as primary
    };
  });

  const uploadedImages = await Promise.all(uploadPromises);

  // Add new images to product
  product.images = [...product.images, ...uploadedImages];
  await product.save();

  successResponse(res, product);
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (Admin/Vendor)
export const deleteProductImage = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if vendor owns the product
  if (
    req.user.user_type === USER_ROLES.VENDOR && 
    product.vendor_id.toString() !== req.user._id.toString()
  ) {
    throw new UnauthorizedError('Not authorized to update this product');
  }

  // Find image to delete
  const imageIndex = product.images.findIndex(
    (img) => img.public_id === req.params.imageId
  );

  if (imageIndex === -1) {
    throw new NotFoundError('Image not found');
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(req.params.imageId);

  // Remove from array
  product.images.splice(imageIndex, 1);

  // If we deleted the primary image and there are other images, set first one as primary
  if (product.images.length > 0 && imageIndex === 0) {
    product.images[0].is_primary = true;
  }

  await product.save();

  successResponse(res, product);
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
export const getProductsByCategory = async (req, res, next) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  const features = new APIFeatures(
    Product.find({ 
      categories: req.params.categoryId,
      is_available: true 
    }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;
  const total = await Product.countDocuments(features.query._conditions);

  paginatedResponse(res, products, total, req.query.page, req.query.limit);
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    throw new BadRequestError('Please provide a search query');
  }

  const features = new APIFeatures(
    Product.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }),
    req.query
  )
    .filter()
    .limitFields()
    .paginate();

  const products = await features.query;
  const total = await Product.countDocuments(features.query._conditions);

  paginatedResponse(res, products, total, req.query.page, req.query.limit);
};