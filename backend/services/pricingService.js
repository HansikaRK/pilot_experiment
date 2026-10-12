const currencyUtils = require('../utils/currency');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const timeService = require('../utils/time');

const pricingService = {
  /**
   * PRICE-001: Centralized pricing pipeline.
   * Precedence:
   * 1. Base price
   * 2. Sale window (skipped for now)
   * 3. Bulk tier (skipped for now)
   * 4. Coupon
   * 5. Loyalty (skipped for now)
   * 6. PRICE-003: Per-product insurance (server-authoritative)
   * 7. Shipping
   * 8. Tax
   */
  calculatePricing: async (cartItems, couponCode = null, shippingCostMinor = 0, taxRate = 0) => {
    let subtotalMinor = 0;
    const lines = [];
    const productCache = new Map(); // Avoid redundant DB lookups during insurance step

    // 1. Base Price
    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      productCache.set(item.productId.toString(), product);

      const unitPriceMinor = currencyUtils.toMinorUnit(product.price);
      const lineTotalMinor = unitPriceMinor * item.quantity;

      subtotalMinor += lineTotalMinor;

      lines.push({
        id: item.productId.toString(),
        productId: item.productId,
        quantity: item.quantity,
        unitPriceMinor,
        amountMinor: lineTotalMinor,
        category: product.category,
        isEligible: true, // Will be updated by coupon rules
        originalAmountMinor: lineTotalMinor
      });
    }

    let discountTotalMinor = 0;
    let couponApplied = null;

    // 4. Coupon
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const now = timeService.now();
        if (coupon.expiresAt < now) {
          throw new Error('Coupon has expired');
        }
        if (coupon.globalUsageCap !== null && coupon.globalUsageCount >= coupon.globalUsageCap) {
          throw new Error('Coupon usage limit reached');
        }
        if (subtotalMinor < coupon.minSpend) {
          throw new Error(`Minimum spend of ${currencyUtils.fromMinorUnit(coupon.minSpend)} not met`);
        }

        // Apply category restrictions
        if (coupon.categoryRestrictions && coupon.categoryRestrictions.length > 0) {
          lines.forEach(line => {
            if (!coupon.categoryRestrictions.includes(line.category)) {
              line.isEligible = false;
            }
          });
        }

        const eligibleSubtotal = lines.reduce((sum, line) => line.isEligible ? sum + line.amountMinor : sum, 0);

        if (eligibleSubtotal > 0) {
          let calculatedDiscountMinor = 0;
          if (coupon.discountType === 'percentage') {
            calculatedDiscountMinor = Math.floor(eligibleSubtotal * (coupon.discountValue / 100));
          } else if (coupon.discountType === 'fixed') {
            calculatedDiscountMinor = Math.min(coupon.discountValue, eligibleSubtotal);
          }

          discountTotalMinor = calculatedDiscountMinor;
          couponApplied = coupon._id;

          // PRICE-002: Multi-line discount deterministic rounding
          const distributedDiscounts = currencyUtils.distributeDiscount(discountTotalMinor, lines);

          lines.forEach(line => {
            const dist = distributedDiscounts.find(d => d.id === line.id);
            if (dist) {
              line.amountMinor -= dist.discountMinor;
            }
          });
        } else {
          throw new Error('No eligible products for this coupon');
        }
      } else {
        throw new Error('Invalid coupon code');
      }
    }

    const subtotalAfterDiscounts = subtotalMinor - discountTotalMinor;

    // PRICE-003: Per-product insurance (server-authoritative — client flag is ignored)
    // Insurance is applied to post-discount line amounts so discount holders aren't
    // over-insured on the original price.
    let insuranceTotalMinor = 0;
    const insuranceLines = [];

    for (const line of lines) {
      const product = productCache.get(line.id);
      if (product && product.insuranceRate > 0) {
        const lineInsuranceMinor = Math.floor(line.amountMinor * (product.insuranceRate / 100));
        insuranceTotalMinor += lineInsuranceMinor;
        insuranceLines.push({
          productId: line.productId,
          productName: product.name,
          rate: product.insuranceRate,
          label: product.insuranceLabel || 'Insurance',
          amountMinor: lineInsuranceMinor,
          required: product.requiresInsurance
        });
      }
    }

    // 7. Shipping (passed in, calculated externally)
    // 8. Tax (applied to subtotal after discounts + insurance + shipping)
    const taxAmountMinor = Math.floor(
      (subtotalAfterDiscounts + insuranceTotalMinor + shippingCostMinor) * (taxRate / 100)
    );

    const totalMinor =
      subtotalAfterDiscounts + insuranceTotalMinor + shippingCostMinor + taxAmountMinor;

    return {
      subtotalMinor,
      discountTotalMinor,
      insuranceTotalMinor,
      insuranceLines,
      shippingCostMinor,
      taxAmountMinor,
      totalMinor,
      couponApplied,
      lines
    };
  }
};

module.exports = pricingService;
