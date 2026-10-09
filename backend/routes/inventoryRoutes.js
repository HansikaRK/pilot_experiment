const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const InventoryBatch = require('../models/InventoryBatch');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');

// @route   GET /api/inventory
// @desc    Get all inventory batches and warehouses
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find();
    const batches = await InventoryBatch.find().populate('productId', 'name price');
    res.json({ success: true, warehouses, batches });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/inventory/warehouses
// @desc    Create a warehouse
router.post('/warehouses', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, location } = req.body;
    const warehouse = await Warehouse.create({ name, location });
    res.status(201).json({ success: true, warehouse });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/inventory/batches
// @desc    Create an inventory batch (refill)
router.post('/batches', protect, adminOnly, async (req, res, next) => {
  try {
    const { productId, warehouseId, quantity, expiryDate } = req.body;
    const batch = await InventoryBatch.create({
      productId, warehouseId, quantity, expiryDate
    });
    
    // Also increase Product's stock field for consistency
    const product = await Product.findById(productId);
    if (product) {
      product.stock += Number(quantity);
      await product.save();
    }
    
    // Populate product details to return
    const populatedBatch = await InventoryBatch.findById(batch._id).populate('productId', 'name price');
    res.status(201).json({ success: true, batch: populatedBatch });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
