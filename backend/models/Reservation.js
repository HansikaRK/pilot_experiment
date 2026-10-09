const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  cartId: { type: String, required: true, unique: true }, // Links to a checkout session
  status: { 
    type: String, 
    enum: ['active', 'committed', 'released', 'expired'], 
    default: 'active' 
  },
  expiresAt: { type: Date, required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    allocations: [{
      batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryBatch', required: true },
      quantity: { type: Number, required: true, min: 1 }
    }]
  }]
}, { timestamps: true });

// For the background sweeper to find expired active reservations
reservationSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
