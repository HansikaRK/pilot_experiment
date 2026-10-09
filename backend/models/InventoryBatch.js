const mongoose = require('mongoose');

const inventoryBatchSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'] },
  expiryDate: { type: Date, required: false }, // for FEFO
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for efficient FEFO querying
inventoryBatchSchema.index({ productId: 1, expiryDate: 1 });

module.exports = mongoose.model('InventoryBatch', inventoryBatchSchema);
