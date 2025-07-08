import mongoose from 'mongoose';
const paymentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  method: { type: String, enum: ['fonepay', 'stripe', 'cod'] },
  gateway_transaction_id: String,
  amount: Number,
  status: { type: String, enum: ['initiated', 'success', 'failed'] },
  timestamp: { type: Date, default: Date.now }
});

export const Payment = mongoose.model('Payment', paymentSchema);