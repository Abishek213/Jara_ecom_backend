import User from '../models/User.js';
import Product from '../models/Product.js';
import { successResponse } from '../utils/responseHandler.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getMe = async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'name images base_price discount_price');

  successResponse(res, user);
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  const { name, phone, preferred_language } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, preferred_language },
    { new: true, runValidators: true }
  );

  successResponse(res, user);
};

// @desc    Delete user account
// @route   DELETE /api/users/delete
// @access  Private
export const deleteAccount = async (req, res, next) => {
  await User.findByIdAndDelete(req.user._id);

  successResponse(res, { message: 'Account deleted successfully' });
};

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getWishlist = async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'name images base_price discount_price');

  successResponse(res, user.wishlist);
};

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
export const addToWishlist = async (req, res, next) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const user = await User.findById(req.user._id);
  
  // Check if product already in wishlist
  if (user.wishlist.includes(req.params.productId)) {
    throw new BadRequestError('Product already in wishlist');
  }

  // Add to wishlist
  user.wishlist.push(req.params.productId);
  await user.save();

  // Increment wishlist count on product
  await Product.findByIdAndUpdate(req.params.productId, {
    $inc: { wishlist_count: 1 }
  });

  successResponse(res, user.wishlist);
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  // Check if product is in wishlist
  if (!user.wishlist.includes(req.params.productId)) {
    throw new BadRequestError('Product not in wishlist');
  }

  // Remove from wishlist
  user.wishlist = user.wishlist.filter(
    id => id.toString() !== req.params.productId
  );
  await user.save();

  // Decrement wishlist count on product
  await Product.findByIdAndUpdate(req.params.productId, {
    $inc: { wishlist_count: -1 }
  });

  successResponse(res, user.wishlist);
};

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
export const addAddress = async (req, res, next) => {
  const user = await User.findById(req.user._id);

  // If this is the first address, set as default
  if (user.addresses.length === 0) {
    req.body.isDefault = true;
  }

  // If setting as default, unset other defaults
  if (req.body.isDefault) {
    user.addresses.forEach(address => {
      address.isDefault = false;
    });
  }

  user.addresses.push(req.body);
  await user.save();

  successResponse(res, user.addresses);
};

// @desc    Update address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
export const updateAddress = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  // Find address index
  const addressIndex = user.addresses.findIndex(
    addr => addr._id.toString() === req.params.addressId
  );

  if (addressIndex === -1) {
    throw new NotFoundError('Address not found');
  }

  // If setting as default, unset other defaults
  if (req.body.isDefault) {
    user.addresses.forEach(address => {
      address.isDefault = false;
    });
  }

  // Update address
  Object.assign(user.addresses[addressIndex], req.body);
  await user.save();

  successResponse(res, user.addresses);
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
export const deleteAddress = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  // Find address index
  const addressIndex = user.addresses.findIndex(
    addr => addr._id.toString() === req.params.addressId
  );

  if (addressIndex === -1) {
    throw new NotFoundError('Address not found');
  }

  // Check if this is the last address
  if (user.addresses.length === 1) {
    throw new BadRequestError('Cannot delete the last address');
  }

  // If deleting default address, set another as default
  if (user.addresses[addressIndex].isDefault) {
    user.addresses[0].isDefault = true; // Set first address as default
  }

  // Remove address
  user.addresses.splice(addressIndex, 1);
  await user.save();

  successResponse(res, user.addresses);
};