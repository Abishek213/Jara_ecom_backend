import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  discount_type: { type: String, enum: ['percentage', 'fixed'] },
  discount_value: Number,
  min_order_amount: Number,
  valid_from: Date,
  valid_until: Date,
  is_active: { type: Boolean, default: true },
});
export default mongoose.model('Promotion', promotionSchema);