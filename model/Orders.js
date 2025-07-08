import mongoose from 'mongoose';
const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: Number,
  unit_price: Number,
  total: Number
});
const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'pending' },
  order_items: [orderItemSchema],
  shipping_address: Object,
  billing_address: Object,
  payment_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  payment_method: { type: String, enum: ['fonepay', 'stripe', 'cod'] },
  shipping_provider: String,
  shipping_tracking_id: String,
  shipping_status: String,
  order_total: Number,
  created_at: { type: Date, default: Date.now }
});

export const Order = mongoose.model('Order', orderSchema);