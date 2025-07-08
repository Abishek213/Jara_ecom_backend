import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  type: String,
  location: String,
  city: String,
  province: String,
  isDefault: Boolean
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password_hash: String,
  user_type: { type: String, enum: ['customer', 'admin', 'vendor', 'manufacturer'] },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  addresses: [addressSchema],
  created_at: { type: Date, default: Date.now },
  social_auth: {
    google_id: String
  }
});

export const User = mongoose.model('User', userSchema);