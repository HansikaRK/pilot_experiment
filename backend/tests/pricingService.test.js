const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const pricingService = require('../services/pricingService');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const timeService = require('../utils/time');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
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

describe('Pricing Service', () => {
  it('PRICE-001: Should apply precedence correctly (Base -> Coupon -> Shipping -> Tax)', async () => {
    const product = await Product.create({
      name: 'Tea', description: 'desc', price: 10, category: 'Tea', image: 'url', stock: 100
    });

    const now = new Date('2026-10-01T10:00:00Z');
    timeService.setMockTime(now);

    const coupon = await Coupon.create({
      code: 'SAVE10', discountType: 'percentage', discountValue: 10, expiresAt: new Date('2026-12-01T00:00:00Z')
    });

    const cartItems = [{ productId: product._id, quantity: 2 }]; // 2 * $10 = $20 -> 2000 minor

    // No coupon
    let result = await pricingService.calculatePricing(cartItems, null, 500, 10); // $5 shipping, 10% tax
    expect(result.subtotalMinor).toBe(2000);
    expect(result.discountTotalMinor).toBe(0);
    expect(result.shippingCostMinor).toBe(500);
    expect(result.taxAmountMinor).toBe(250); // (2000 + 500) * 0.1
    expect(result.totalMinor).toBe(2750); // 2000 + 500 + 250

    // With coupon
    result = await pricingService.calculatePricing(cartItems, 'SAVE10', 500, 10);
    expect(result.subtotalMinor).toBe(2000);
    expect(result.discountTotalMinor).toBe(200); // 10% of 2000
    expect(result.shippingCostMinor).toBe(500);
    expect(result.taxAmountMinor).toBe(230); // (2000 - 200 + 500) * 0.1 = 2300 * 0.1 = 230
    expect(result.totalMinor).toBe(2530); // 1800 + 500 + 230
  });

  it('PRICE-003: Should reject expired or limited coupons', async () => {
    const product = await Product.create({
      name: 'Tea', description: 'desc', price: 10, category: 'Tea', image: 'url', stock: 100
    });

    const now = new Date('2026-10-01T10:00:00Z');
    timeService.setMockTime(now);

    const coupon = await Coupon.create({
      code: 'EXPIRED', discountType: 'fixed', discountValue: 100, expiresAt: new Date('2026-09-01T00:00:00Z')
    });

    const cartItems = [{ productId: product._id, quantity: 1 }];

    await expect(pricingService.calculatePricing(cartItems, 'EXPIRED', 0, 0)).rejects.toThrow('Coupon has expired');
  });
});
