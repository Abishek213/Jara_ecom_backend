import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  role: { type: String, enum: ['superadmin', 'product_manager', 'order_manager'] },
  last_login: Date,
  actions_log: [{
    action: String,
    target_id: String,
    timestamp: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Admin', adminSchema);