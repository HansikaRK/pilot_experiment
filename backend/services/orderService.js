const Order = require('../models/Order');
const OrderHistory = require('../models/OrderHistory');
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
        // Release inventory reservation
        await inventoryService.releaseReservation(order.cartId, 'released');
        
        // In a real app, we might also reverse coupon usage here by decrementing globalUsageCount
      }

      return order;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = orderService;
