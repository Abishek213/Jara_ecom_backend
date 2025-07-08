import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  name: String,
  slug: String,
  brand: String,
  description: String,
  product_type: { type: String, enum: ['standard', 'factory'] },
  images: [String],
  base_price: Number,
  discount_price: Number,
  stock_qty: Number,
  sku: String,
  tags: [String],
  sizes: [String],
  colors: [String],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  is_featured: Boolean,
  is_available: Boolean,
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: Date
});

export const Product = mongoose.model('Product', productSchema);