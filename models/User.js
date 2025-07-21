import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/constants.js';
import { USER_ROLES } from '../enums/roles.enum.js';
import crypto from 'crypto';
// const { sign } = jwt;
// import { sign } from 'jsonwebtoken';




const addressSchema = new mongoose.Schema({
  type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  first_name: String,
  last_name: String,
  street: String,
  city: String,
  province: String,
  phone: String,
  isDefault: { type: Boolean, default: false },
}, { _id: false });

const socialAuthSchema = new mongoose.Schema({
  google_id: String,
  facebook_id: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a name'] },
  email: { 
    type: String, 
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  phone: { 
    type: String, 
    required: [true, 'Please add a phone number'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please add a valid 10-digit phone number']
  },
  password_hash: { type: String, select: false },
  user_type: { 
    type: String, 
    enum: Object.values(USER_ROLES), 
    default: USER_ROLES.CUSTOMER 
  },
  status: { 
    type: String, 
    enum: ['active', 'suspended'], 
    default: 'active' 
  },
  addresses: [addressSchema],
  social_auth: socialAuthSchema,
  wishlist: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  }],
  preferred_language: { 
    type: String, 
    enum: ['en', 'ne'], 
    default: 'en' 
  },
  email_verified: { 
    type: Boolean, 
    default: false 
  },
  email_verification_token: String,
  email_verification_expires: Date,
  password_reset_token: String,
  password_reset_expires: Date,
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: Date,
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Cascade delete products when a vendor is deleted
userSchema.pre('remove', async function(next) {
  if (this.user_type === USER_ROLES.VENDOR) {
    await this.model('Product').deleteMany({ vendor_id: this._id });
  }
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  
  return jwt.sign(
    { id: this._id, userType: this.user_type }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');

  this.email_verification_token = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.email_verification_expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.password_reset_token = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

export default mongoose.model('User', userSchema);
