const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  status: { type: String, enum: ['pending', 'packed', 'shipped', 'delivered'], default: 'pending' },
  trackingNumber: { type: String },
  trackingEvents: [{
    status: String,
    timestamp: Date,
    location: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
