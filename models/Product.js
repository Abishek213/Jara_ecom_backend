import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  slug: String,
  brand: { 
    type: String, 
    required: [true, 'Please add a brand'],
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  product_type: { 
    type: String, 
    enum: ['standard', 'factory'], 
    default: 'standard' 
  },
  images: [{
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    is_primary: { type: Boolean, default: false }
  }],
  base_price: { 
    type: Number, 
    required: [true, 'Please add a base price'],
    min: [0, 'Price must be at least 0']
  },
  discount_price: { 
    type: Number, 
    min: [0, 'Discount price must be at least 0'],
    validate: {
      validator: function(val) {
        return val < this.base_price;
      },
      message: 'Discount price ({VALUE}) must be below base price'
    }
  },
  stock_qty: { 
    type: Number, 
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock quantity must be at least 0'],
    default: 0
  },
  sku: { 
    type: String, 
    unique: true,
    sparse: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  sizes: [{
    type: String,
    trim: true
  }],
  colors: [{
    type: String,
    trim: true
  }],
  categories: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    required: [true, 'Please add at least one category']
  }],
  is_featured: { 
    type: Boolean, 
    default: false 
  },
  is_available: { 
    type: Boolean, 
    default: true 
  },
  vendor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [
      function() { return this.product_type === 'factory'; },
      'Vendor ID is required for factory products'
    ]
  },
  weight: { 
    type: Number, 
    min: [0, 'Weight must be at least 0'],
    default: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  return_policy_days: { 
    type: Number, 
    min: [0, 'Return policy days must be at least 0'],
    default: 7 
  },
  wishlist_count: { 
    type: Number, 
    default: 0 
  },
  average_rating: { 
    type: Number, 
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating must be at most 5'],
    default: 0
  },
  review_count: { 
    type: Number, 
    default: 0 
  },
  related_products: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: Date,
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create product slug from name before saving
productSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Cascade delete reviews when a product is deleted
productSchema.pre('remove', async function(next) {
  await this.model('Review').deleteMany({ product_id: this._id });
  next();
});

// Reverse populate with virtuals for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product_id',
  justOne: false
});

// Static method to calculate average rating
productSchema.statics.getAverageRating = async function(productId) {
  const obj = await this.aggregate([
    {
      $match: { product_id: productId }
    },
    {
      $group: {
        _id: '$product_id',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Product').findByIdAndUpdate(productId, {
      average_rating: obj[0] ? Math.round(obj[0].averageRating * 10) / 10 : 0,
      review_count: obj[0] ? obj[0].count : 0
    });
  } catch (err) {
    console.error(err);
  }
};

export default mongoose.model('Product', productSchema);