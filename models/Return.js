import mongoose from "mongoose";

const returnSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  items_returned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  return_status: { type: String, enum: ['requested', 'approved', 'rejected', 'refunded'], default: 'requested' },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Return', returnSchema);