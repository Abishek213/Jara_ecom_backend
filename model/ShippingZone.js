import mongoose from "mongoose";

const shippingZoneSchema = new mongoose.Schema({
  region_name: String,
  shipping_rate: Number,
  estimated_days: Number,
  is_remote: Boolean
});

export const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);