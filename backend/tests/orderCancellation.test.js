/**
 * ORDER-003 – Order Cancellation & Inventory Release
 *
 * Tests that cancelling an order correctly releases inventory back to stock
 * regardless of whether the order is in 'pending' (reservation still active)
 * or 'paid' (reservation already committed after successful payment).
 */

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const inventoryService = require('../services/inventoryService');
const orderService     = require('../services/orderService');
const InventoryBatch   = require('../models/InventoryBatch');
const Product          = require('../models/Product');
const Warehouse        = require('../models/Warehouse');
const Reservation      = require('../models/Reservation');
const Order            = require('../models/Order');
const OrderHistory     = require('../models/OrderHistory');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ---------------------------------------------------------------------------
// Helper: create a product + warehouse + batch and return them
// ---------------------------------------------------------------------------
async function setupInventory(batchQty = 10) {
  const product = await Product.create({
    name: 'Test Tea', description: 'desc', price: 500,
    category: 'Tea', image: 'url', stock: batchQty
  });
  const warehouse = await Warehouse.create({ name: 'WH1', location: 'Colombo' });
  const batch = await InventoryBatch.create({
    productId: product._id, warehouseId: warehouse._id, quantity: batchQty
  });
  return { product, warehouse, batch };
}

// Helper: create a minimal Order document
async function createOrder(status, cartId, productId) {
  return Order.create({
    orderId: 'CC-' + Math.random().toString(36).slice(2).toUpperCase(),
    customer: {
      name: 'Test User', email: 'test@example.com', phone: '0771234567',
      address: { street: '1 Main St', city: 'Colombo', postalCode: '10000' }
    },
    items: [{
      productId,
      name: 'Test Tea',
      unitPriceMinor: 50000,
      quantity: 3,
      amountMinor: 150000
    }],
    subtotalMinor: 150000,
    totalAmountMinor: 150000,
    status,
    cartId
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ORDER-003: Order Cancellation and Inventory Release', () => {

  // ---- 1. Pending order: active reservation released on cancellation --------

  it('should release an ACTIVE reservation when a pending order is cancelled', async () => {
    const CART_ID = 'cart-pending-cancel';
    const { product, batch } = await setupInventory(10);

    // Reserve 3 units (simulates checkout)
    await inventoryService.reserveStock(CART_ID, [{ productId: product._id, quantity: 3 }]);

    // Verify batch was decremented
    const batchAfterReserve = await InventoryBatch.findById(batch._id);
    expect(batchAfterReserve.quantity).toBe(7);

    // Verify reservation is active
    const reservation = await Reservation.findOne({ cartId: CART_ID });
    expect(reservation.status).toBe('active');

    // Create a pending order for this cart
    const order = await createOrder('pending', CART_ID, product._id);

    // Cancel the order
    const cancelled = await orderService.transitionOrderState(
      order._id, 'cancelled', 'customer', 'Changed my mind'
    );
    expect(cancelled.status).toBe('cancelled');

    // Reservation should now be released
    const releasedReservation = await Reservation.findOne({ cartId: CART_ID });
    expect(releasedReservation.status).toBe('released');

    // Batch stock should be fully restored
    const batchAfterCancel = await InventoryBatch.findById(batch._id);
    expect(batchAfterCancel.quantity).toBe(10);

    // An OrderHistory entry should exist
    const history = await OrderHistory.findOne({ orderId: order._id, newStatus: 'cancelled' });
    expect(history).not.toBeNull();
    expect(history.actor).toBe('customer');
  });

  // ---- 2. Paid order: committed reservation released on cancellation --------

  it('should release a COMMITTED reservation when a paid order is cancelled', async () => {
    const CART_ID = 'cart-paid-cancel';
    const { product, batch } = await setupInventory(10);

    // Reserve then commit (simulates successful payment webhook)
    await inventoryService.reserveStock(CART_ID, [{ productId: product._id, quantity: 5 }]);
    await inventoryService.commitReservation(CART_ID);

    // Verify reservation is committed
    const committedReservation = await Reservation.findOne({ cartId: CART_ID });
    expect(committedReservation.status).toBe('committed');

    // Batch should have been decremented during reservation
    const batchAfterCommit = await InventoryBatch.findById(batch._id);
    expect(batchAfterCommit.quantity).toBe(5);

    // Create a paid order
    const order = await createOrder('paid', CART_ID, product._id);

    // Admin cancels the paid order
    const cancelled = await orderService.transitionOrderState(
      order._id, 'cancelled', 'admin', 'Customer requested refund cancellation'
    );
    expect(cancelled.status).toBe('cancelled');

    // Reservation should now be released (not still committed)
    const releasedReservation = await Reservation.findOne({ cartId: CART_ID });
    expect(releasedReservation.status).toBe('released');

    // Batch stock MUST be fully restored — this was the core bug
    const batchAfterCancel = await InventoryBatch.findById(batch._id);
    expect(batchAfterCancel.quantity).toBe(10);

    // History entry must be present
    const history = await OrderHistory.findOne({ orderId: order._id, newStatus: 'cancelled' });
    expect(history).not.toBeNull();
    expect(history.actor).toBe('admin');
  });

  // ---- 3. Already-cancelled order cannot be cancelled again ----------------

  it('should reject a second cancellation attempt on an already-cancelled order', async () => {
    const CART_ID = 'cart-double-cancel';
    const { product } = await setupInventory(10);

    const order = await createOrder('cancelled', CART_ID, product._id);

    await expect(
      orderService.transitionOrderState(order._id, 'cancelled', 'admin', 'Duplicate')
    ).rejects.toThrow(/Invalid state transition/);
  });

  // ---- 4. Non-cancellable statuses are rejected ----------------------------

  it('should reject cancellation of an order that is already shipped', async () => {
    const CART_ID = 'cart-shipped-cancel';
    const { product } = await setupInventory(10);

    const order = await createOrder('shipped', CART_ID, product._id);

    await expect(
      orderService.transitionOrderState(order._id, 'cancelled', 'customer', 'Too late')
    ).rejects.toThrow(/Invalid state transition/);
  });

  // ---- 5. Idempotency: releasing an already-released reservation is safe ---

  it('should safely no-op when releaseReservation is called on an already-released cart', async () => {
    const CART_ID = 'cart-idempotent';
    const { product } = await setupInventory(10);

    await inventoryService.reserveStock(CART_ID, [{ productId: product._id, quantity: 2 }]);
    await inventoryService.releaseReservation(CART_ID, 'released'); // first release
    const result = await inventoryService.releaseReservation(CART_ID, 'released'); // second call
    expect(result).toBeNull(); // safe no-op
  });

  // ---- 6. No inventory side-effect when cancellation is rejected -----------

  it('should not modify inventory when a state transition is invalid', async () => {
    const CART_ID = 'cart-no-side-effect';
    const { product, batch } = await setupInventory(10);

    await inventoryService.reserveStock(CART_ID, [{ productId: product._id, quantity: 4 }]);
    const batchAfterReserve = await InventoryBatch.findById(batch._id);
    expect(batchAfterReserve.quantity).toBe(6);

    const order = await createOrder('shipped', CART_ID, product._id);

    // This should throw, not touch inventory
    await expect(
      orderService.transitionOrderState(order._id, 'cancelled', 'customer', 'Oops')
    ).rejects.toThrow(/Invalid state transition/);

    // Batch quantity must be unchanged after the failed transition
    const batchAfterFailedCancel = await InventoryBatch.findById(batch._id);
    expect(batchAfterFailedCancel.quantity).toBe(6);
  });
});
