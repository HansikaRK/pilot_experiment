const Order = require('../models/Order');
const OrderHistory = require('../models/OrderHistory');
const PaymentIntent = require('../models/PaymentIntent');
const inventoryService = require('./inventoryService');
const mongoose = require('mongoose');

const VALID_TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['packed', 'cancelled', 'refunded'],
  packed: ['shipped'],
  shipped: ['delivered', 'refunded'], 
  delivered: ['refunded'], 
  cancelled: [],
  refunded: []
};

const orderService = {
  /**
   * ORDER-001: Enforce valid state transitions.
   */
  transitionOrderState: async (orderId, newStatus, actor, reason = '') => {
    try {
      const order = await Order.findById(orderId);
      if (!order) throw new Error('Order not found');

      const currentStatus = order.status;
      
      if (currentStatus === newStatus) {
        return order; // No-op
      }

      if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
        throw new Error(`Invalid state transition from ${currentStatus} to ${newStatus}`);
      }

      order.status = newStatus;
      await order.save();

      const historyEntry = new OrderHistory({
        orderId: order._id,
        previousStatus: currentStatus,
        newStatus,
        actor,
        reason
      });
      await historyEntry.save();

      // ORDER-003: Cancellation logic
      if (newStatus === 'cancelled') {
        // Release inventory reservation.
        //
        // This covers two scenarios:
        //  1. pending → cancelled (pre-payment): reservation is 'active'.
        //     releaseReservation restores batch stock and marks it 'released'.
        //
        //  2. paid → cancelled (post-payment): reservation is already 'committed'.
        //     releaseReservation now also accepts 'committed' status, restores batch
        //     stock, and marks it 'released'. Without this fix the inventory was
        //     silently orphaned.
        await inventoryService.releaseReservation(order.cartId, 'released');

        // If the order was paid, void the payment intent so it can no longer be
        // charged or accidentally re-refunded after the stock has been returned.
        if (currentStatus === 'paid') {
          await PaymentIntent.findOneAndUpdate(
            { orderId: order._id, status: 'succeeded' },
            { status: 'refunded' }
          );
        }

        // TODO: Reverse coupon usage by decrementing Coupon.globalUsageCount
        //       if order.couponApplied is set.
      }

      return order;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = orderService;
