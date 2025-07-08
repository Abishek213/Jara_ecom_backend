import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  slug: { type: String, enum: ['about-us', 'privacy-policy', 'terms'] },
  content_html: String,
  updated_by_admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
});

export const Page = mongoose.model('Page', pageSchema);