const mongoose = require('mongoose');

const paymentIntentSchema = new mongoose.Schema({
  intentId: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  amountMinor: { type: Number, required: true },
  currency: { type: String, default: 'LKR' },
  status: { type: String, enum: ['requires_payment', 'succeeded', 'failed', 'refunded'], default: 'requires_payment' },
  idempotencyKey: { type: String, unique: true, sparse: true },
  refundedAmountMinor: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
