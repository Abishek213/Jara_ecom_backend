import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  type: { type: String, enum: ['order', 'system', 'promotion'] },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export const Notification = mongoose.model('Notification', notificationSchema);