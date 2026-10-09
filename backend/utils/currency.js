// utils/currency.js
// Money and rounding rules for minor currency units

const currencyUtils = {
  /**
   * Convert a floating point amount to minor units (integer).
   * E.g., LKR 1250.50 -> 125050
   */
  toMinorUnit: (amount) => {
    return Math.round(amount * 100);
  },

  /**
   * Convert minor units to a display string (floating point).
   * E.g., 125050 -> 1250.50
   */
  fromMinorUnit: (minorUnit) => {
    return minorUnit / 100;
  },

  /**
   * Distribute a discount across multiple lines.
   * If rounding leaves leftover cents, they are assigned to the highest-value eligible line.
   * 
   * @param {number} totalDiscountMinor - Total discount to apply in minor units.
   * @param {Array<{id: string, amountMinor: number, isEligible: boolean}>} lines - Line items.
   * @returns {Array<{id: string, discountMinor: number}>} - Discount allocated per line.
   */
  distributeDiscount: (totalDiscountMinor, lines) => {
    const eligibleLines = lines.filter(line => line.isEligible && line.amountMinor > 0);
    
    if (eligibleLines.length === 0) {
      return lines.map(line => ({ id: line.id, discountMinor: 0 }));
    }

    const totalEligibleAmount = eligibleLines.reduce((sum, line) => sum + line.amountMinor, 0);
    
    if (totalEligibleAmount === 0) {
      return lines.map(line => ({ id: line.id, discountMinor: 0 }));
    }

    let remainingDiscount = totalDiscountMinor;
    const allocatedDiscounts = {};

    // Initial proportionate allocation using integer math (floor)
    eligibleLines.forEach(line => {
      // Calculate fraction of total eligible amount
      const proportion = line.amountMinor / totalEligibleAmount;
      // Round down to avoid over-allocating
      const discountForLine = Math.floor(totalDiscountMinor * proportion);
      allocatedDiscounts[line.id] = discountForLine;
      remainingDiscount -= discountForLine;
    });

    // If there are remaining cents, assign them one by one to the highest value lines
    if (remainingDiscount > 0) {
      // Sort eligible lines by amountMinor descending
      const sortedLines = [...eligibleLines].sort((a, b) => b.amountMinor - a.amountMinor);
      
      for (let i = 0; i < remainingDiscount; i++) {
        const lineToIncrement = sortedLines[i % sortedLines.length];
        allocatedDiscounts[lineToIncrement.id] += 1;
      }
    }

    return lines.map(line => ({
      id: line.id,
      discountMinor: allocatedDiscounts[line.id] || 0
    }));
  }
};

module.exports = currencyUtils;
