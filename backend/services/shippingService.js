const ShippingZone = require('../models/ShippingZone');

const HIGH_VALUE_CATEGORIES = ['Gems'];
const INSURANCE_RATE = 0.01; // 1% of the insurable (high-value) subtotal

const DEFAULT_ISLAND_WIDE = {
  baseRateMinor: 100000,
  perKgRateMinor: 20000,
  freeShippingThresholdMinor: 1000000
};

const shippingService = {
  /**
   * SHIP-001, SHIP-002: Calculate shipping cost
   * - weight-based calculation
   * - high-value goods insurance (server-side category detection)
   * - free shipping threshold
   *
   * @param {Array}   cartItems                   - Items with { productId, quantity, name, price, category }
   * @param {number}  subtotalAfterDiscountsMinor  - Full cart subtotal after all discounts (minor units)
   * @param {string}  district                     - Delivery district (used for zone lookup)
   * @param {string}  country                      - Delivery country (fallback zone lookup)
   * @param {boolean} hasHighValueGoods            - CLIENT HINT only; server always re-checks from pricingLines
   * @param {number}  totalWeightKg                - Total shipment weight
   * @param {Array}   pricingLines                 - Line items from pricingService (with post-discount amountMinor
   *                                                 and category). When provided, insurance is calculated on the
   *                                                 discounted Gems subtotal only. Otherwise falls back to the
   *                                                 client hint (preview / legacy path).
   */
  calculateShipping: async (cartItems, subtotalAfterDiscountsMinor, district, country, hasHighValueGoods = false, totalWeightKg = 1, pricingLines = null) => {
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

    // Free shipping check (note: insurance is still added below even when shipping is free)
    let shippingCostMinor = 0;
    if (!(rates.freeShippingThresholdMinor !== null && subtotalAfterDiscountsMinor >= rates.freeShippingThresholdMinor)) {
      shippingCostMinor = rates.baseRateMinor + Math.floor(rates.perKgRateMinor * weightKg);
    }

    // SHIP-002: High-value goods insurance
    //
    // Bug fixes applied here:
    //
    // FIX 1 – Server-side detection: the client-supplied `hasHighValueGoods` flag is unreliable.
    //   When pricingLines are available we detect high-value goods from item categories directly,
    //   so a customer cannot bypass insurance by omitting the flag.
    //
    // FIX 2 – Mixed-cart correctness: insurance must be charged only on the Gems (high-value)
    //   portion of the cart. Previously 1% was applied to the *entire* subtotal even when only
    //   one line out of many contained Gems. Now we isolate the insurable subtotal.
    //
    // FIX 3 – Discount-aware: when pricingLines carry post-discount amountMinor values the
    //   insurable subtotal is already net of any coupon discount, so insurance is computed on
    //   the correct reduced value rather than the pre-discount Gems amount.
    let insurableSubtotalMinor = 0;

    const isHighValue = (category) => {
      if (!category) return false;
      return HIGH_VALUE_CATEGORIES.some(cat => cat.toLowerCase() === String(category).toLowerCase());
    };

    if (pricingLines && pricingLines.length > 0) {
      // Preferred path (checkout): sum post-discount amountMinor of high-value lines only
      insurableSubtotalMinor = pricingLines
        .filter(line => isHighValue(line.category))
        .reduce((sum, line) => sum + line.amountMinor, 0);
    } else if (cartItems && cartItems.length > 0 && cartItems.some(i => isHighValue(i.category))) {
      insurableSubtotalMinor = cartItems
        .filter(i => isHighValue(i.category))
        .reduce((sum, i) => sum + (i.amountMinor || (i.price ? Math.round(i.price * 100 * (i.quantity || 1)) : 0)), 0);
    } else if (hasHighValueGoods) {
      // Fallback (preview endpoint / legacy callers): no per-line detail available,
      // use the full subtotal as a conservative estimate.
      insurableSubtotalMinor = subtotalAfterDiscountsMinor;
    }

    if (insurableSubtotalMinor > 0) {
      const insuranceMinor = Math.floor(insurableSubtotalMinor * INSURANCE_RATE);
      shippingCostMinor += insuranceMinor;
    }

    return shippingCostMinor;
  }
};

module.exports = shippingService;
