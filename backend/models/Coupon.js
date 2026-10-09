const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true }, // percentage (e.g. 10) or minor units
  minSpend: { type: Number, default: 0 }, // in minor units
  categoryRestrictions: [{ type: String }], // Optional categories this applies to
  usageCapPerUser: { type: Number, default: 1 },
  globalUsageCap: { type: Number, default: null }, // null means unlimited
  globalUsageCount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  stackable: { type: Boolean, default: false } // Whether it can be used with other discounts
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
