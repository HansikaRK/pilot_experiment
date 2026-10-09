const ShippingZone = require('../models/ShippingZone');

const DEFAULT_ISLAND_WIDE = {
  baseRateMinor: 100000,
  perKgRateMinor: 20000,
  freeShippingThresholdMinor: 1000000
};

const shippingService = {
  /**
   * SHIP-001, SHIP-002: Calculate shipping cost
   * - weight based calculation
   * - high value goods insurance
   * - free shipping threshold
   */
  calculateShipping: async (cartItems, subtotalAfterDiscountsMinor, district, country, hasHighValueGoods = false, totalWeightKg = 1) => {
    const weightKg = Number(totalWeightKg) > 0 ? Number(totalWeightKg) : 1;
    const districtName = (district || '').trim();
    const countryName = (country || 'Sri Lanka').trim();

    // 1. Find matching zone (District first, then country fallback)
    let zone = districtName
      ? await ShippingZone.findOne({ type: 'district', value: new RegExp(`^${districtName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
      : null;
    if (!zone) {
      zone = await ShippingZone.findOne({ type: 'country', value: new RegExp(`^${countryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    }

    const rates = zone || DEFAULT_ISLAND_WIDE;

    // Free shipping check
    if (rates.freeShippingThresholdMinor !== null && subtotalAfterDiscountsMinor >= rates.freeShippingThresholdMinor) {
      return 0; // Free shipping
    }

    let shippingCostMinor = rates.baseRateMinor + Math.floor(rates.perKgRateMinor * weightKg);

    // High value insurance (e.g. Gems)
    if (hasHighValueGoods) {
      // e.g. 1% of the subtotal
      const insuranceMinor = Math.floor(subtotalAfterDiscountsMinor * 0.01);
      shippingCostMinor += insuranceMinor;
    }

    return shippingCostMinor;
  }
};

module.exports = shippingService;
