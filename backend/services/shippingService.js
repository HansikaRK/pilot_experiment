const ShippingZone = require('../models/ShippingZone');

const shippingService = {
  /**
   * SHIP-001, SHIP-002: Calculate shipping cost
   * - weight based calculation
   * - high value goods insurance
   * - free shipping threshold
   */
  calculateShipping: async (cartItems, subtotalAfterDiscountsMinor, district, country, hasHighValueGoods = false, totalWeightKg = 1) => {
    // 1. Find matching zone (District first, then country fallback)
    let zone = await ShippingZone.findOne({ type: 'district', value: district });
    if (!zone) {
      zone = await ShippingZone.findOne({ type: 'country', value: country });
    }

    if (!zone) {
      throw new Error(`Shipping is not supported to ${district}, ${country}`);
    }

    // Free shipping check
    if (zone.freeShippingThresholdMinor !== null && subtotalAfterDiscountsMinor >= zone.freeShippingThresholdMinor) {
      return 0; // Free shipping
    }

    let shippingCostMinor = zone.baseRateMinor + Math.floor(zone.perKgRateMinor * totalWeightKg);

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
