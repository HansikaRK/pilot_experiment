const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { param, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// @route   GET /api/products
// @desc    Fetch all products, optionally filter by category and/or keyword search
router.get('/', async (req, res, next) => {
  try {
    const query = { isDeleted: { $ne: true } };
    
    // Optional category filter
    if (req.query.category) {
      // Sanitize the category parameter to prevent XSS
      query.category = sanitizeHtml(req.query.category, {
        allowedTags: [],
        allowedAttributes: {}
      });
    }

    // Optional keyword search (regex on product name)
    if (req.query.keyword) {
      // Sanitize input to strip HTML tags
      let keyword = sanitizeHtml(req.query.keyword, {
        allowedTags: [],
        allowedAttributes: {}
      });

      // Escape special regex characters to prevent ReDoS
      keyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      query.name = { $regex: keyword, $options: 'i' };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
// @desc    Fetch single product by id
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid product ID')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const product = await Product.findById(req.params.id);
      
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   POST /api/products
// @desc    Create a product
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

const Order = require('../models/Order');
const InventoryBatch = require('../models/InventoryBatch');

// @route   DELETE /api/products/:id
// @desc    Soft Delete a product
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { removeInventory } = req.query;

    // Check for pending orders
    const activeOrders = await Order.find({
      'items.productId': productId,
      status: { $in: ['pending', 'paid', 'packed', 'shipped'] }
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete product: there are active orders containing this product.' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });

    // Soft delete the product
    product.isDeleted = true;
    await product.save();

    // Remove associated inventory if requested
    if (removeInventory === 'true') {
      await InventoryBatch.updateMany({ productId }, { $set: { isActive: false, quantity: 0 } });
    }

    res.json({ success: true, message: 'Product successfully archived' });
  } catch (error) {
    next(error);
  }
});
