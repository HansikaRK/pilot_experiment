const ShippingZone = require('../models/ShippingZone');

const DEFAULT_ISLAND_WIDE = {
  baseRateMinor: 100000,
  perKgRateMinor: 20000,
  freeShippingThresholdMinor: 1000000
};

const shippingService = {
  /**
   * SHIP-001, SHIP-002: Calculate shipping cost
   * - weight-based calculation
   * - high-value goods insurance (applied only to the insurable item value)
   * - free-shipping threshold
   *
   * @param {Array}  cartItems                    - Cart line items (not used for rate lookup, kept for future per-item rules)
   * @param {number} subtotalAfterDiscountsMinor  - Full cart subtotal after discounts (used for free-shipping threshold)
   * @param {string} district                     - Delivery district / city
   * @param {string} country                      - Delivery country
   * @param {number} highValueSubtotalMinor        - Post-discount value of HIGH-VALUE items only (0 = no insurance).
   *                                               Previously this was a boolean `hasHighValueGoods`; using the
   *                                               actual monetary value fixes two bugs:
   *                                                 1. Mixed carts: insurance no longer applies to non-insurable items.
   *                                                 2. Discount interaction: when only some items are discounted the
   *                                                    insurance base correctly reflects the discounted high-value value.
   * @param {number} totalWeightKg                - Total order weight in kg
   */
  calculateShipping: async (cartItems, subtotalAfterDiscountsMinor, district, country, highValueSubtotalMinor = 0, totalWeightKg = 1) => {
    const weightKg = Number(totalWeightKg) > 0 ? Number(totalWeightKg) : 1;
    const districtName = (district || '').trim();
    const countryName = (country || 'Sri Lanka').trim();
    const insurableValue = Number(highValueSubtotalMinor) > 0 ? Number(highValueSubtotalMinor) : 0;

    // 1. Find matching zone (District first, then country fallback)
    let zone = districtName
      ? await ShippingZone.findOne({ type: 'district', value: new RegExp(`^${districtName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
      : null;
    if (!zone) {
      zone = await ShippingZone.findOne({ type: 'country', value: new RegExp(`^${countryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    }

    const rates = zone || DEFAULT_ISLAND_WIDE;

    // Free shipping check (against full cart subtotal after discounts)
    if (rates.freeShippingThresholdMinor !== null && subtotalAfterDiscountsMinor >= rates.freeShippingThresholdMinor) {
      return 0; // Free shipping
    }

    let shippingCostMinor = rates.baseRateMinor + Math.floor(rates.perKgRateMinor * weightKg);

    // High-value goods insurance: 1% of the POST-DISCOUNT value of insurable items only.
    // insurableValue is 0 when there are no high-value goods in the cart.
    if (insurableValue > 0) {
      const insuranceMinor = Math.floor(insurableValue * 0.01);
      shippingCostMinor += insuranceMinor;
    }

    return shippingCostMinor;
  }
};

module.exports = shippingService;
