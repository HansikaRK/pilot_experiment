const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Colombo District", "Sri Lanka Outstation"
  type: { type: String, enum: ['district', 'country'], required: true },
  value: { type: String, required: true }, // e.g. "Colombo"
  baseRateMinor: { type: Number, required: true },
  perKgRateMinor: { type: Number, default: 0 },
  freeShippingThresholdMinor: { type: Number, default: null } // null means no free shipping
}, { timestamps: true });

module.exports = mongoose.model('ShippingZone', shippingZoneSchema);
