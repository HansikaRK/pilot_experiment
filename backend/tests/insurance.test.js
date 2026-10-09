/**
 * SHIP-002 – High-Value Goods Insurance
 *
 * Verifies that insurance is:
 *   1. Applied only to Gems lines, not the full cart subtotal (mixed-cart fix)
 *   2. Computed on the post-discount Gems subtotal (discount-aware fix)
 *   3. Detected server-side from categories, not from the client flag (security fix)
 *   4. Zero for carts containing no Gems regardless of the client flag
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const shippingService = require('../services/shippingService');
const pricingService  = require('../services/pricingService');
const ShippingZone    = require('../models/ShippingZone');
const Product         = require('../models/Product');
const Coupon          = require('../models/Coupon');
const timeService     = require('../utils/time');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  // Create a known shipping zone so tests are deterministic
  await ShippingZone.create({
    name: 'Colombo', type: 'district', value: 'Colombo',
    baseRateMinor: 50000,      // LKR 500
    perKgRateMinor: 10000,     // LKR 100/kg
    freeShippingThresholdMinor: 99999999 // effectively disabled for these tests
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Product.deleteMany({});
  await Coupon.deleteMany({});
  timeService.clearMockTime();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** weight=1kg → baseRate(50000) + perKg(10000*1) = 60000 */
const BASE_SHIPPING = 60000;

function makeLine(category, amountMinor) {
  return { id: 'x', productId: new mongoose.Types.ObjectId(), quantity: 1,
           unitPriceMinor: amountMinor, amountMinor, category, isEligible: true };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SHIP-002: High-Value Goods Insurance', () => {

  // ---- 1. Gems-only cart: insurance = 1% of Gems subtotal ------------------

  it('should add 1% insurance for a Gems-only cart', async () => {
    const gemsLine = makeLine('Gems', 1000000); // LKR 10,000
    const pricingLines = [gemsLine];
    const subtotalAfterDiscounts = 1000000;

    const shipping = await shippingService.calculateShipping(
      [], subtotalAfterDiscounts, 'Colombo', 'Sri Lanka',
      false, 1, pricingLines
    );

    // BASE_SHIPPING + 1% of 1,000,000 = 60,000 + 10,000 = 70,000
    expect(shipping).toBe(BASE_SHIPPING + 10000);
  });

  // ---- 2. Non-Gems cart: no insurance regardless of client flag -------------

  it('should NOT add insurance for a non-Gems cart even if client sends hasHighValueGoods=true', async () => {
    const teaLine = makeLine('Tea', 500000); // LKR 5,000
    const pricingLines = [teaLine];
    const subtotalAfterDiscounts = 500000;

    const shipping = await shippingService.calculateShipping(
      [], subtotalAfterDiscounts, 'Colombo', 'Sri Lanka',
      true,  // client flag — should be ignored when pricingLines provided
      1, pricingLines
    );

    // No Gems lines → no insurance → only base shipping
    expect(shipping).toBe(BASE_SHIPPING);
  });

  // ---- 3. Mixed cart: insurance only on Gems portion -----------------------

  it('should apply insurance only to the Gems portion in a mixed cart', async () => {
    const teaLine  = makeLine('Tea',  800000); // LKR 8,000
    const gemsLine = makeLine('Gems', 200000); // LKR 2,000
    const pricingLines = [teaLine, gemsLine];
    const subtotalAfterDiscounts = 1000000;

    const shipping = await shippingService.calculateShipping(
      [], subtotalAfterDiscounts, 'Colombo', 'Sri Lanka',
      false, 1, pricingLines
    );

    // Insurance = 1% of Gems only = 1% of 200,000 = 2,000
    // NOT 1% of 1,000,000 = 10,000 (old buggy behaviour)
    expect(shipping).toBe(BASE_SHIPPING + 2000);
  });

  // ---- 4. Discount-aware: insurance on post-discount Gems amount -----------

  it('should compute insurance on post-discount Gems amount', async () => {
    // Gems line: 500,000 gross → after 10% coupon discount → 450,000
    const gemsLineAfterDiscount = makeLine('Gems', 450000);
    const pricingLines = [gemsLineAfterDiscount];
    const subtotalAfterDiscounts = 450000;

    const shipping = await shippingService.calculateShipping(
      [], subtotalAfterDiscounts, 'Colombo', 'Sri Lanka',
      false, 1, pricingLines
    );

    // Insurance = 1% of 450,000 = 4,500  (not 1% of 500,000 = 5,000)
    expect(shipping).toBe(BASE_SHIPPING + 4500);
  });

  // ---- 5. Mixed cart + discount: Gems portion discounted, Tea not ----------

  it('should calculate insurance on Gems-only post-discount amount in a mixed discounted cart', async () => {
    const now = new Date('2026-10-01T10:00:00Z');
    timeService.setMockTime(now);

    // Create two products
    const teaProduct = await Product.create({
      name: 'Ceylon Tea', description: 'desc', price: 800, category: 'Tea', image: 'img', stock: 100
    });
    const gemProduct = await Product.create({
      name: 'Blue Sapphire', description: 'desc', price: 2000, category: 'Gems', image: 'img', stock: 10
    });

    // 10% off Gems-only coupon
    await Coupon.create({
      code: 'GEMS10', discountType: 'percentage', discountValue: 10,
      categoryRestrictions: ['Gems'],
      expiresAt: new Date('2027-01-01T00:00:00Z')
    });

    const cartItems = [
      { productId: teaProduct._id, quantity: 1 },  // Tea:  800 → 80,000 minor
      { productId: gemProduct._id, quantity: 1 }   // Gems: 2000 → 200,000 minor
    ];

    // Run through pricingService to get accurate post-discount lines
    const pricing = await pricingService.calculatePricing(cartItems, 'GEMS10', 0, 0);

    // Tea: 80,000 (unchanged), Gems: 200,000 - 10% = 180,000
    const teaLine  = pricing.lines.find(l => l.category === 'Tea');
    const gemsLine = pricing.lines.find(l => l.category === 'Gems');
    expect(teaLine.amountMinor).toBe(80000);
    expect(gemsLine.amountMinor).toBe(180000);

    const subtotalAfterDiscounts = pricing.subtotalMinor - pricing.discountTotalMinor;

    const shipping = await shippingService.calculateShipping(
      cartItems, subtotalAfterDiscounts, 'Colombo', 'Sri Lanka',
      false, 1, pricing.lines
    );

    // Insurance = 1% of Gems post-discount = 1% of 180,000 = 1,800
    // Old buggy behaviour would have used 1% of full subtotal 260,000 = 2,600
    expect(shipping).toBe(BASE_SHIPPING + 1800);
  });

  // ---- 6. No pricingLines + hasHighValueGoods=false → no insurance ---------

  it('should not add insurance in preview/legacy path when hasHighValueGoods is false', async () => {
    const shipping = await shippingService.calculateShipping(
      [], 1000000, 'Colombo', 'Sri Lanka',
      false, 1, null // no pricingLines, client flag false
    );
    expect(shipping).toBe(BASE_SHIPPING);
  });

  // ---- 7. No pricingLines + hasHighValueGoods=true → fallback insurance ----

  it('should use full subtotal as fallback for insurance in preview path', async () => {
    const subtotal = 500000;
    const shipping = await shippingService.calculateShipping(
      [], subtotal, 'Colombo', 'Sri Lanka',
      true, 1, null // no pricingLines, client flag true (preview path)
    );
    // Insurance = 1% of 500,000 = 5,000
    expect(shipping).toBe(BASE_SHIPPING + 5000);
  });
});
