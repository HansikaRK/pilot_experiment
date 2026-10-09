const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const inventoryService = require('../services/inventoryService');
const InventoryBatch = require('../models/InventoryBatch');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Reservation = require('../models/Reservation');
const timeService = require('../utils/time');

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
    const collection = collections[key];
    await collection.deleteMany({});
  }
  timeService.clearMockTime();
});

describe('Inventory Service', () => {
  it('INV-001, INV-002: Should atomically reserve stock using FEFO', async () => {
    const product = await Product.create({
      name: 'Tea', description: 'desc', price: 10, category: 'Tea', image: 'url', stock: 100
    });
    const warehouse = await Warehouse.create({ name: 'W1', location: 'L1' });

    // Create batches with different expiry dates
    const now = new Date('2026-10-01T10:00:00Z');
    timeService.setMockTime(now);

    const batch1 = await InventoryBatch.create({
      productId: product._id, warehouseId: warehouse._id, quantity: 5, expiryDate: new Date('2026-12-01T00:00:00Z')
    });
    const batch2 = await InventoryBatch.create({
      productId: product._id, warehouseId: warehouse._id, quantity: 10, expiryDate: new Date('2026-11-01T00:00:00Z') // Expires earlier! Should be picked first.
    });

    const items = [{ productId: product._id, quantity: 12 }];
    const reservation = await inventoryService.reserveStock('cart-123', items);

    expect(reservation.items[0].allocations).toHaveLength(2);
    // FEFO: batch2 expires earlier, so we take 10 from it first
    expect(reservation.items[0].allocations[0].batchId.toString()).toEqual(batch2._id.toString());
    expect(reservation.items[0].allocations[0].quantity).toBe(10);
    // Then 2 from batch1
    expect(reservation.items[0].allocations[1].batchId.toString()).toEqual(batch1._id.toString());
    expect(reservation.items[0].allocations[1].quantity).toBe(2);

    // Verify batch quantities updated
    const b1 = await InventoryBatch.findById(batch1._id);
    const b2 = await InventoryBatch.findById(batch2._id);
    expect(b1.quantity).toBe(3);
    expect(b2.quantity).toBe(0);
  });

  it('INV-004: Should release expired reservations', async () => {
    const product = await Product.create({
      name: 'Tea', description: 'desc', price: 10, category: 'Tea', image: 'url', stock: 100
    });
    const warehouse = await Warehouse.create({ name: 'W1', location: 'L1' });
    const batch1 = await InventoryBatch.create({
      productId: product._id, warehouseId: warehouse._id, quantity: 10
    });

    const items = [{ productId: product._id, quantity: 5 }];
    await inventoryService.reserveStock('cart-1', items);

    // Fast forward 16 minutes
    timeService.setMockTime(new Date(Date.now() + 16 * 60000));

    const releasedCount = await inventoryService.releaseExpiredReservations();
    expect(releasedCount).toBe(1);

    const b1 = await InventoryBatch.findById(batch1._id);
    expect(b1.quantity).toBe(10); // Stock restored
  });
});
