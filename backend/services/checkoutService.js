const mongoose = require('mongoose');
const crypto = require('crypto');
const inventoryService = require('./inventoryService');
const pricingService = require('./pricingService');
const shippingService = require('./shippingService');
const paymentService = require('./paymentService');
const Product = require('../models/Product');
const Order = require('../models/Order');

const checkoutService = {
  /**
   * Cross-module checkout flow
   */
  processCheckout: async (cartId, customer, items, couponCode, hasHighValueGoods = false, totalWeightKg = 1, taxRate = 0, userId = null) => {
    // 1. Reserve inventory atomically
    const reservation = await inventoryService.reserveStock(cartId, items);

    try {
      // 2. Load products to calculate subtotal & pricing
      const cartItemsForPricing = [];
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (product.isDeleted) throw new Error(`Product is no longer available: ${product.name}`);
        cartItemsForPricing.push({
          productId: product._id,
          quantity: item.quantity,
          name: product.name,
          price: product.price
        });
      }

      // Preliminary pricing to get subtotal after discounts (for free shipping threshold)
      const preliminaryPricing = await pricingService.calculatePricing(cartItemsForPricing, couponCode, 0, 0);
      
      // 3. Calculate shipping
      const shippingCostMinor = await shippingService.calculateShipping(
        cartItemsForPricing, 
        preliminaryPricing.subtotalMinor - preliminaryPricing.discountTotalMinor,
        customer.address.city, // using city as district
        'Sri Lanka', 
        hasHighValueGoods,
        totalWeightKg
      );

      // 4. Calculate final pricing (with shipping & tax)
      const finalPricing = await pricingService.calculatePricing(
        cartItemsForPricing,
        couponCode,
        shippingCostMinor,
        taxRate
      );

      // 5. Create Order
      const orderId = 'CC-' + crypto.randomBytes(4).toString('hex').toUpperCase();

      const newOrder = new Order({
        orderId,
        user: userId,
        customer,
        items: finalPricing.lines.map(line => {
          const originalItem = cartItemsForPricing.find(i => i.productId.toString() === line.id);
          return {
            productId: line.productId,
            name: originalItem ? originalItem.name : 'Unknown Product',
            unitPriceMinor: line.unitPriceMinor,
            quantity: line.quantity,
            amountMinor: line.amountMinor
          };
        }),
        subtotalMinor: finalPricing.subtotalMinor,
        discountTotalMinor: finalPricing.discountTotalMinor,
        shippingCostMinor: finalPricing.shippingCostMinor,
        taxAmountMinor: finalPricing.taxAmountMinor,
        totalAmountMinor: finalPricing.totalMinor,
        currency: 'LKR',
        currencyRate: 1.0, // Snapshotted rate
        status: 'pending',
        couponApplied: finalPricing.couponApplied,
        cartId: cartId
      });

      const savedOrder = await newOrder.save();

      // 6. Create Payment Intent
      const paymentIntent = await paymentService.createPaymentIntent(
        savedOrder._id,
        savedOrder.totalAmountMinor,
        savedOrder.currency
      );

      return {
        order: savedOrder,
        paymentIntent,
        reservationExpiresAt: reservation.expiresAt
      };
    } catch (error) {
      // If anything fails (pricing, shipping, saving), release the reservation
      await inventoryService.releaseReservation(cartId, 'released');
      throw error;
    }
  }
};

module.exports = checkoutService;
