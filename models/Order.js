import mongoose from 'mongoose';
import { ORDER_STATUS } from '../enums/orderStatus.enum.js';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../enums/paymentMethods.enum.js';

const orderItemSchema = new mongoose.Schema({
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true
  },
  quantity: { 
    type: Number, 
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unit_price: { 
    type: Number, 
    required: true,
    min: [0, 'Price must be at least 0']
  },
  total: { 
    type: Number, 
    required: true,
    min: [0, 'Total must be at least 0']
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  status: { 
    type: String, 
    enum: Object.values(ORDER_STATUS), 
    default: ORDER_STATUS.PENDING 
  },
  order_items: [orderItemSchema],
  shipping_address: {
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    phone: { type: String, required: true }
  },
  billing_address: {
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    phone: { type: String, required: true }
  },
  payment_status: { 
    type: String, 
    enum: Object.values(PAYMENT_STATUS), 
    default: PAYMENT_STATUS.INITIATED 
  },
  payment_method: { 
    type: String, 
    enum: Object.values(PAYMENT_METHODS), 
    required: true 
  },
  payment_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Payment' 
  },
  shipping_provider: String,
  shipping_tracking_id: String,
  shipping_cost: { 
    type: Number, 
    default: 0,
    min: [0, 'Shipping cost must be at least 0']
  },
  order_total: { 
    type: Number, 
    required: true,
    min: [0, 'Order total must be at least 0']
  },
  discount_applied: { 
    type: Number, 
    default: 0,
    min: [0, 'Discount must be at least 0']
  },
  tax_amount: { 
    type: Number, 
    default: 0,
    min: [0, 'Tax must be at least 0']
  },
  promo_code: { 
    type: String 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate order total before saving
orderSchema.pre('save', function(next) {
  // Calculate items total
  const itemsTotal = this.order_items.reduce(
    (sum, item) => sum + (item.unit_price * item.quantity), 
    0
  );

  // Calculate order total (items + shipping - discount + tax)
  this.order_total = itemsTotal + this.shipping_cost - this.discount_applied + this.tax_amount;
  next();
});

// Cascade delete payments when an order is deleted
orderSchema.pre('remove', async function(next) {
  await this.model('Payment').deleteMany({ order_id: this._id });
  next();
});

export default mongoose.model('Order', orderSchema);