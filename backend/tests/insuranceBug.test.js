const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const shippingService = require("../services/shippingService");
const pricingService = require("../services/pricingService");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const timeService = require("../utils/time");

// ─── DEFAULT_ISLAND_WIDE rates ───────────────────────────────────────────────
// baseRateMinor:              100_000
// perKgRateMinor:              20_000
// freeShippingThresholdMinor: 1_000_000  (LKR 10,000)
//
// All test subtotals are intentionally kept BELOW the free-shipping threshold
// (1_000_000 minor) so the weight + insurance path is exercised.

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  for (const col of Object.values(mongoose.connection.collections)) {
    await col.deleteMany({});
  }
  timeService.clearMockTime();
});

// ─── SHIP-002a: Gems-only cart, no discount ───────────────────────────────────
// Gems worth LKR 1000 = 100_000 minor  (well below free-shipping threshold)
// Insurance = 1% of 100_000 = 1_000 minor
// Base shipping = 100_000 + 20_000 (1 kg) = 120_000
// Expected total shipping = 121_000
describe("SHIP-002a: Gems-only cart with insurance (no discount)", () => {
  it("insurance is 1% of full Gems subtotal", async () => {
    const highValueSubtotalMinor = 100000; // LKR 1,000 of Gems
    const cost = await shippingService.calculateShipping(
      [], 100000, "Colombo", "Sri Lanka", highValueSubtotalMinor, 1
    );
    expect(cost).toBe(121000); // 120000 base+weight + 1000 insurance
  });
});

// ─── SHIP-002b: Mixed cart — insurance must NOT apply to Tea value ────────────
// Tea  = 50_000 minor, Gems = 100_000 minor  =>  full subtotal = 150_000
// Old (broken): insurance = 1% of 150_000 = 1_500 minor
// New (correct): insurance = 1% of 100_000 = 1_000 minor
describe("SHIP-002b: Mixed cart — insurance applied only to Gems value", () => {
  it("insurance uses only Gems subtotal, not full cart subtotal", async () => {
    const fullSubtotalMinor = 150000;
    const highValueSubtotalMinor = 100000; // Gems only

    const cost = await shippingService.calculateShipping(
      [], fullSubtotalMinor, "Colombo", "Sri Lanka", highValueSubtotalMinor, 1
    );
    // 120000 base+weight + 1000 insurance = 121000
    expect(cost).toBe(121000);
  });

  it("no insurance when highValueSubtotalMinor is 0 (no Gems in cart)", async () => {
    const cost = await shippingService.calculateShipping(
      [], 150000, "Colombo", "Sri Lanka", 0, 1
    );
    expect(cost).toBe(120000); // base + weight only
  });
});

// ─── SHIP-002c: Category-restricted coupon on Tea — insurance base unchanged ──
// Tea = LKR 500 = 50_000 minor, Gems = LKR 1000 = 100_000 minor
// 10% Tea coupon => discount = 5_000 minor (Tea only)
// Post-discount full subtotal = 145_000
// Old buggy insurance = 1% of 145_000 = 1_450
// Correct insurance   = 1% of 100_000 (Gems untouched) = 1_000
describe("SHIP-002c: Category-restricted coupon — insurance base is Gems value only", () => {
  it("10% Tea coupon does not change Gems insurance base", async () => {
    timeService.setMockTime(new Date("2026-10-01T10:00:00Z"));

    const teaProduct = await Product.create({
      name: "Ceylon Tea", description: "desc", price: 500,
      category: "Tea", image: "url", stock: 100
    });
    const gemsProduct = await Product.create({
      name: "Blue Sapphire", description: "desc", price: 1000,
      category: "Gems", image: "url", stock: 10
    });

    await Coupon.create({
      code: "TEA10", discountType: "percentage", discountValue: 10,
      categoryRestrictions: ["Tea"],
      expiresAt: new Date("2026-12-01T00:00:00Z")
    });

    const cartItems = [
      { productId: teaProduct._id, quantity: 1, price: 500, name: "Ceylon Tea", category: "Tea" },
      { productId: gemsProduct._id, quantity: 1, price: 1000, name: "Blue Sapphire", category: "Gems" }
    ];

    const prelimPricing = await pricingService.calculatePricing(cartItems, "TEA10", 0, 0);

    // Discount should be 10% of Tea only (50_000 minor)
    expect(prelimPricing.discountTotalMinor).toBe(5000);

    // Gems line must be unaffected
    const gemsLine = prelimPricing.lines.find(l => l.category === "Gems");
    expect(gemsLine.amountMinor).toBe(100000); // price 1000 * 100

    // Insurance base = Gems post-discount = 100_000
    const highValueSubtotalMinor = prelimPricing.lines
      .filter(l => l.category === "Gems")
      .reduce((s, l) => s + l.amountMinor, 0);
    expect(highValueSubtotalMinor).toBe(100000);

    const subtotalAfterDiscount = prelimPricing.subtotalMinor - prelimPricing.discountTotalMinor;
    const cost = await shippingService.calculateShipping(
      [], subtotalAfterDiscount, "Colombo", "Sri Lanka", highValueSubtotalMinor, 1
    );
    // 120000 + 1000 insurance = 121000  (NOT 121450 as the old bug would give)
    expect(cost).toBe(121000);
  });
});

// ─── SHIP-002d: Coupon on Gems — insurance base reduces proportionally ────────
// Gems = LKR 1000 = 100_000 minor; 20% Gems coupon => 20_000 discount
// Post-discount Gems = 80_000 minor
// Correct insurance = 1% of 80_000 = 800
describe("SHIP-002d: Discount on Gems reduces the insurance base accordingly", () => {
  it("20% Gems coupon reduces insurance base to post-discount Gems value", async () => {
    timeService.setMockTime(new Date("2026-10-01T10:00:00Z"));

    const gemsProduct = await Product.create({
      name: "Ruby", description: "desc", price: 1000,
      category: "Gems", image: "url", stock: 10
    });

    await Coupon.create({
      code: "GEMS20", discountType: "percentage", discountValue: 20,
      categoryRestrictions: ["Gems"],
      expiresAt: new Date("2026-12-01T00:00:00Z")
    });

    const cartItems = [
      { productId: gemsProduct._id, quantity: 1, price: 1000, name: "Ruby", category: "Gems" }
    ];

    const prelimPricing = await pricingService.calculatePricing(cartItems, "GEMS20", 0, 0);

    expect(prelimPricing.discountTotalMinor).toBe(20000); // 20% of 100000

    const gemsLine = prelimPricing.lines.find(l => l.category === "Gems");
    expect(gemsLine.amountMinor).toBe(80000); // post-discount

    const highValueSubtotalMinor = prelimPricing.lines
      .filter(l => l.category === "Gems")
      .reduce((s, l) => s + l.amountMinor, 0);
    expect(highValueSubtotalMinor).toBe(80000);

    const subtotalAfterDiscount = prelimPricing.subtotalMinor - prelimPricing.discountTotalMinor;
    const cost = await shippingService.calculateShipping(
      [], subtotalAfterDiscount, "Colombo", "Sri Lanka", highValueSubtotalMinor, 1
    );
    // 120000 + 800 (1% of 80000) = 120800
    expect(cost).toBe(120800);
  });
});

// ─── SHIP-001: Free-shipping threshold uses full subtotal (unchanged) ─────────
describe("SHIP-001: Free-shipping threshold uses full cart subtotal (unchanged)", () => {
  it("free shipping fires when full subtotal >= threshold, regardless of Gems value", async () => {
    // Full subtotal = 1_000_000 >= threshold => free shipping
    const cost = await shippingService.calculateShipping(
      [], 1000000, "Colombo", "Sri Lanka", 500000, 1
    );
    expect(cost).toBe(0);
  });
});
