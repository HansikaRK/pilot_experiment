const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const checkoutService = require('../services/checkoutService');
const paymentService = require('../services/paymentService');

// @route   GET /api/orders
// @desc    Get all orders (admin only)
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/myorders
// @desc    Get customer orders
router.get('/myorders', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ 
      $or: [
        { 'customer.email': req.user.email },
        { user: req.user._id }
      ]
    }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
});

// Validation chain for creating an order
const validateOrder = [
  body('cartId').notEmpty().withMessage('cartId is required'),
  body('customer.name').notEmpty().withMessage('Name is required').trim().escape().isLength({ max: 100 }),
  body('customer.email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('customer.phone').notEmpty().withMessage('Phone is required').trim().matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone format').isLength({ max: 20 }),
  body('customer.address.street').notEmpty().withMessage('Street is required').trim().escape().isLength({ max: 200 }),
  body('customer.address.city').notEmpty().withMessage('City is required').trim().escape().isLength({ max: 100 }),
  body('customer.address.postalCode').notEmpty().withMessage('Postal code is required').trim().escape().isLength({ max: 20 }),
  
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().isMongoId().withMessage('Valid product ID required for items'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// @route   POST /api/orders/checkout
// @desc    Integrated Checkout Flow
router.post('/checkout', protect, validateOrder, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
      });
    }

    const { cartId, customer, items, couponCode, hasHighValueGoods, totalWeightKg } = req.body;

    const result = await checkoutService.processCheckout(cartId, customer, items, couponCode, hasHighValueGoods, totalWeightKg, 0, req.user._id);

    res.status(201).json({
      success: true,
      order: result.order,
      paymentIntent: result.paymentIntent,
      reservationExpiresAt: result.reservationExpiresAt
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/orders/preview
// @desc    Preview pricing without creating order or reservations
router.post('/preview', async (req, res, next) => {
  try {
    const { items, customer, couponCode, hasHighValueGoods, totalWeightKg } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'No items' });
    
    // Preliminary pricing
    const pricingService = require('../services/pricingService');
    const shippingService = require('../services/shippingService');
    const Product = require('../models/Product');
    
    const cartItemsForPricing = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        cartItemsForPricing.push({
          productId: product._id,
          quantity: item.quantity,
          name: product.name,
          price: product.price
        });
      }
    }

    const preliminaryPricing = await pricingService.calculatePricing(cartItemsForPricing, couponCode, 0, 0);
    
    let shippingCostMinor = 0;
    if (customer && customer.address && customer.address.city) {
      shippingCostMinor = await shippingService.calculateShipping(
        cartItemsForPricing, 
        preliminaryPricing.subtotalMinor - preliminaryPricing.discountTotalMinor,
        customer.address.city,
        'Sri Lanka', 
        hasHighValueGoods,
        totalWeightKg
      );
    }

    const finalPricing = await pricingService.calculatePricing(
      cartItemsForPricing,
      couponCode,
      shippingCostMinor,
      0
    );

    res.json({
      success: true,
      pricing: finalPricing
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/orders/webhook
// @desc    Simulated payment webhook
router.post('/webhook', async (req, res, next) => {
  try {
    const result = await paymentService.handleWebhook(req.body);
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
