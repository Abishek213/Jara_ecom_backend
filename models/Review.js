import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  images: [String],
  status: { type: String, enum: ['approved', 'pending'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Review', reviewSchema);