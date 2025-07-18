import mongoose from "mongoose";

const shippingZoneSchema = new mongoose.Schema({
  region_name: String,
  shipping_rate: Number,
  estimated_days: Number,
  is_remote: Boolean,
  supported_couriers: [String]
});

export default mongoose.model('ShippingZone', shippingZoneSchema);