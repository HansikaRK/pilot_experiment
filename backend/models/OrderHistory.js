const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  previousStatus: { type: String },
  newStatus: { type: String, required: true },
  actor: { type: String, required: true }, // e.g., 'system', 'customer', 'admin'
  reason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('OrderHistory', orderHistorySchema);
