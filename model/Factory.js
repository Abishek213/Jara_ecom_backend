import mongoose from 'mongoose';

const factorySchema = new mongoose.Schema({
  company_name: String,
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  business_license_doc: String,
  address: String,
  contact_number: String,
  products_listed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  verified: Boolean,
  created_at: { type: Date, default: Date.now }
});

export const Factory = mongoose.model('Factory', factorySchema);