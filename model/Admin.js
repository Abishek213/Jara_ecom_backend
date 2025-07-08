import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  role: { type: String, enum: ['superadmin', 'product_manager', 'order_manager'] },
  last_login: Date,
  created_at: { type: Date, default: Date.now }
});

export const Admin = mongoose.model('Admin', adminSchema);