const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');

// Validation chain for creating an order
const validateOrder = [
  body('customer.name').notEmpty().withMessage('Name is required').trim().escape().isLength({ max: 100 }),
  body('customer.email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('customer.phone').notEmpty().withMessage('Phone is required').trim().matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone format').isLength({ max: 20 }),
  body('customer.address.street').notEmpty().withMessage('Street is required').trim().escape().isLength({ max: 200 }),
  body('customer.address.city').notEmpty().withMessage('City is required').trim().escape().isLength({ max: 100 }),
  body('customer.address.postalCode').notEmpty().withMessage('Postal code is required').trim().escape().isLength({ max: 20 }),
  
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().isMongoId().withMessage('Valid product ID required for items'),
  body('items.*.name').notEmpty().trim().escape(),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  
  body('paymentStatus').equals('success').withMessage('Payment must be successful')
];

// @route   POST /api/orders
// @desc    Create new order
router.post('/', validateOrder, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
      });
    }

    const { customer, items, paymentStatus } = req.body;

    // 1. Generate orderId: 'CC-' + 8 random hex uppercase chars
    const orderId = 'CC-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // 2. Calculate totalAmount server-side
    const totalAmount = items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // 3. Save order to DB
    const newOrder = new Order({
      orderId,
      customer,
      items,
      totalAmount,
      paymentStatus
    });

    const savedOrder = await newOrder.save();

    // 4. Return 201 response
    res.status(201).json({
      success: true,
      order: {
        orderId: savedOrder.orderId,
        totalAmount: savedOrder.totalAmount,
        items: savedOrder.items,
        customer: savedOrder.customer,
        createdAt: savedOrder.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders
// @desc    Get all orders
router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
