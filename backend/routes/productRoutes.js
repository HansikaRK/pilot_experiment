const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { param, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// @route   GET /api/products
// @desc    Fetch all products, optionally filter by category
router.get('/', async (req, res, next) => {
  try {
    const query = {};
    
    // Optional category filter
    if (req.query.category) {
      // Sanitize the category parameter to prevent XSS
      query.category = sanitizeHtml(req.query.category, {
        allowedTags: [],
        allowedAttributes: {}
      });
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
