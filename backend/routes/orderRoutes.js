const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const checkoutService = require('../services/checkoutService');
const paymentService = require('../services/paymentService');
const orderService = require('../services/orderService');

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

    const { cartId, customer, items, couponCode } = req.body;
    const hasHighValueGoods = Boolean(req.body.hasHighValueGoods);
    const totalWeightKg = Number(req.body.totalWeightKg) > 0 ? Number(req.body.totalWeightKg) : 1;

    const result = await checkoutService.processCheckout(cartId, customer, items, couponCode, hasHighValueGoods, totalWeightKg, 0, req.user._id);

    res.status(201).json({
      success: true,
      order: result.order,
      paymentIntent: result.paymentIntent,
      reservationExpiresAt: result.reservationExpiresAt
    });
  } catch (error) {
    if (error && error.message) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

// @route   POST /api/orders/preview
// @desc    Preview pricing without creating order or reservations
router.post('/preview', async (req, res, next) => {
  try {
    const { items, customer, couponCode } = req.body;
    const hasHighValueGoods = Boolean(req.body.hasHighValueGoods);
    const totalWeightKg = Number(req.body.totalWeightKg) > 0 ? Number(req.body.totalWeightKg) : 1;
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
          price: product.price,
          category: product.category  // needed so pricingService lines carry category for insurance logic
        });
      }
    }

    const preliminaryPricing = await pricingService.calculatePricing(cartItemsForPricing, couponCode, 0, 0);

    // Derive insurable value: post-discount value of Gems items only.
    // Using the actual Gems subtotal (not the full cart) matches the fix in checkoutService.
    const highValueSubtotalMinor = hasHighValueGoods
      ? preliminaryPricing.lines
          .filter(line => line.category === 'Gems')
          .reduce((sum, line) => sum + line.amountMinor, 0)
      : 0;

    const subtotalAfterDiscountsMinor = preliminaryPricing.subtotalMinor - preliminaryPricing.discountTotalMinor;
    
    let shippingCostMinor = 0;
    if (customer && customer.address && customer.address.city) {
      shippingCostMinor = await shippingService.calculateShipping(
        cartItemsForPricing, 
        subtotalAfterDiscountsMinor,
        customer.address.city,
        'Sri Lanka', 
        highValueSubtotalMinor,
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

// @route   PATCH /api/orders/:id/cancel
// @desc    Cancel an order and restore inventory.
//          - Customers may cancel their own orders only when status is 'pending'.
//          - Admins may cancel any order whose current status allows cancellation
//            (i.e., 'pending' or 'paid').
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = (
      (order.user && order.user.toString() === req.user._id.toString()) ||
      order.customer.email === req.user.email
    );

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Customers may only cancel pending orders.
    // Admins may cancel pending or paid orders (handled by the state-machine in orderService).
    if (!isAdmin && order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status '${order.status}'.`
      });
    }

    const actor = isAdmin ? 'admin' : 'customer';
    const reason = req.body.reason || 'Cancelled by request';

    const updatedOrder = await orderService.transitionOrderState(
      order._id, 'cancelled', actor, reason
    );

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    if (error && error.message) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

module.exports = router;
