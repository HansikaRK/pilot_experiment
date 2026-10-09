const mongoose = require('mongoose');
const crypto = require('crypto');
const PaymentIntent = require('../models/PaymentIntent');
const orderService = require('./orderService');
const inventoryService = require('./inventoryService');

const paymentService = {
  /**
   * PAY-001: Server-authoritative payment intent creation
   */
  createPaymentIntent: async (orderId, amountMinor, currency) => {
    const intentId = 'PI-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    
    const intent = new PaymentIntent({
      intentId,
      orderId,
      amountMinor,
      currency,
      status: 'requires_payment'
    });
    
    await intent.save();
    return intent;
  },

  /**
   * PAY-002: Simulated webhook handler (idempotent, out-of-order resilient)
   */
  handleWebhook: async (webhookEvent) => {
    try {
      const { type, intentId, idempotencyKey } = webhookEvent;

      const intent = await PaymentIntent.findOne({ intentId });
      
      if (!intent) {
        throw new Error(`PaymentIntent ${intentId} not found`);
      }

      // If already processed with a terminal outcome, it's idempotent
      if (intent.status === 'succeeded' || intent.status === 'failed') {
        return { message: 'Already processed' };
      }

      if (type === 'payment.succeeded') {
        intent.status = 'succeeded';
        if (idempotencyKey) intent.idempotencyKey = idempotencyKey;
        await intent.save();

        // Move order to paid
        await orderService.transitionOrderState(intent.orderId, 'paid', 'system', 'Payment succeeded');
        
        // Commit inventory
        const order = await mongoose.model('Order').findById(intent.orderId);
        await inventoryService.commitReservation(order.cartId);

      } else if (type === 'payment.failed') {
        intent.status = 'failed';
        if (idempotencyKey) intent.idempotencyKey = idempotencyKey;
        await intent.save();

        // Cancel order
        await orderService.transitionOrderState(intent.orderId, 'cancelled', 'system', 'Payment failed');
      }

      return intent;
    } catch (error) {
      throw error;
    }
  },

  /**
   * PAY-003: Refunds (partial/full limits)
   */
  processRefund: async (intentId, refundAmountMinor, reason) => {
    try {
      const intent = await PaymentIntent.findOne({ intentId });
      
      if (!intent || intent.status !== 'succeeded') {
        throw new Error('Can only refund succeeded payments');
      }

      const remainingRefundable = intent.amountMinor - intent.refundedAmountMinor;
      
      if (refundAmountMinor > remainingRefundable) {
        throw new Error(`Refund amount ${refundAmountMinor} exceeds remaining refundable amount ${remainingRefundable}`);
      }

      intent.refundedAmountMinor += refundAmountMinor;
      
      if (intent.refundedAmountMinor === intent.amountMinor) {
         intent.status = 'refunded';
      }
      
      await intent.save();

      if (intent.status === 'refunded') {
         await orderService.transitionOrderState(intent.orderId, 'refunded', 'admin', reason);
      }

      return intent;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = paymentService;
