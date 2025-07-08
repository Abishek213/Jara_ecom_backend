import mongoose from 'mongoose';
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  description: String
});

export const Category = mongoose.model('Category', categorySchema);