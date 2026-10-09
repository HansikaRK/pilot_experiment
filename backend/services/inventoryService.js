const mongoose = require('mongoose');
const InventoryBatch = require('../models/InventoryBatch');
const Reservation = require('../models/Reservation');
const Product = require('../models/Product');
const timeService = require('../utils/time');

const RESERVATION_DURATION_MINUTES = 15;

const inventoryService = {
  /**
   * INV-001, INV-002: Atomic reservation creation with FEFO batch allocation.
   * Prevents overselling.
   */
  reserveStock: async (cartId, items) => {
    try {
      // 1. Check if an active reservation already exists for this cart
      const existing = await Reservation.findOne({ cartId, status: 'active' });
      if (existing) {
        throw new Error('Active reservation already exists for this cart');
      }

      const reservationItems = [];

      for (const item of items) {
        let remainingQuantityToReserve = item.quantity;
        const itemAllocations = [];

        // Find available batches for this product, sorted by expiryDate (FEFO), then by creation date.
        // Ignore batches with 0 quantity or expired batches.
        const now = timeService.now();
        const batches = await InventoryBatch.find({
          productId: item.productId,
          isActive: true,
          quantity: { $gt: 0 },
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gt: now } }
          ]
        })
        .sort({ expiryDate: 1, createdAt: 1 });

        for (const batch of batches) {
          if (remainingQuantityToReserve === 0) break;

          const quantityToTake = Math.min(batch.quantity, remainingQuantityToReserve);
          
          // Atomically decrement batch quantity
          const updatedBatch = await InventoryBatch.findOneAndUpdate(
            { _id: batch._id, quantity: { $gte: quantityToTake } },
            { $inc: { quantity: -quantityToTake } },
            { new: true }
          );

          if (!updatedBatch) {
            // Concurrent modification happened, abort and retry
            throw new Error(`Concurrency error allocating batch ${batch._id}`);
          }

          itemAllocations.push({
            batchId: batch._id,
            quantity: quantityToTake
          });

          remainingQuantityToReserve -= quantityToTake;
        }

        if (remainingQuantityToReserve > 0) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        reservationItems.push({
          productId: item.productId,
          quantity: item.quantity,
          allocations: itemAllocations
        });
      }

      const expiresAt = new Date(timeService.now().getTime() + RESERVATION_DURATION_MINUTES * 60000);

      const reservation = new Reservation({
        cartId,
        status: 'active',
        expiresAt,
        items: reservationItems
      });

      await reservation.save();
      return reservation;

    } catch (error) {
      throw error;
    }
  },

  /**
   * Commit a reservation (e.g., after successful payment).
   */
  commitReservation: async (cartId) => {
    try {
      const reservation = await Reservation.findOne({ cartId, status: 'active' });
      
      if (!reservation) {
        throw new Error('Active reservation not found');
      }

      reservation.status = 'committed';
      await reservation.save();

      return reservation;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Release a reservation (e.g., after payment failure, cancellation, or expiry).
   */
  releaseReservation: async (cartId, newStatus = 'released') => {
    try {
      const reservation = await Reservation.findOne({ 
        cartId, 
        status: 'active' 
      });
      
      if (!reservation) {
        return null; // Already processed or doesn't exist
      }

      // Restore stock for all allocations
      for (const item of reservation.items) {
        for (const alloc of item.allocations) {
          await InventoryBatch.findByIdAndUpdate(
            alloc.batchId,
            { $inc: { quantity: alloc.quantity } }
          );
        }
      }

      reservation.status = newStatus;
      await reservation.save();

      return reservation;
    } catch (error) {
      throw error;
    }
  },

  /**
   * INV-004: Release all expired reservations.
   */
  releaseExpiredReservations: async () => {
    const now = timeService.now();
    
    // Find all active reservations that have expired
    const expiredReservations = await Reservation.find({
      status: 'active',
      expiresAt: { $lte: now }
    });

    let releasedCount = 0;
    for (const res of expiredReservations) {
      try {
        await inventoryService.releaseReservation(res.cartId, 'expired');
        releasedCount++;
      } catch (err) {
        console.error(`Failed to release expired reservation ${res._id}:`, err);
      }
    }
    
    return releasedCount;
  }
};

module.exports = inventoryService;
