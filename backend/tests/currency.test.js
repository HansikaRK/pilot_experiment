const currencyUtils = require('../utils/currency');

describe('Currency Utils', () => {
  it('should convert to minor units', () => {
    expect(currencyUtils.toMinorUnit(1250.50)).toBe(125050);
    expect(currencyUtils.toMinorUnit(10.99)).toBe(1099);
  });

  it('should convert from minor units', () => {
    expect(currencyUtils.fromMinorUnit(125050)).toBe(1250.50);
  });

  it('PRICE-007: should distribute discount and allocate leftover cent to highest value line', () => {
    const lines = [
      { id: '1', amountMinor: 1000, isEligible: true },
      { id: '2', amountMinor: 500, isEligible: true },
      { id: '3', amountMinor: 500, isEligible: true }
    ];
    // Total eligible: 2000. Discount: 100 (which is 5%)
    // Line 1 should get 50, Line 2 25, Line 3 25
    let dist = currencyUtils.distributeDiscount(100, lines);
    expect(dist).toEqual([
      { id: '1', discountMinor: 50 },
      { id: '2', discountMinor: 25 },
      { id: '3', discountMinor: 25 }
    ]);

    // Now test a remainder scenario
    // Total: 2000. Discount: 33 (1.65%)
    // Line 1 proportion = 33 * (1000/2000) = 16.5 -> 16
    // Line 2 proportion = 33 * (500/2000) = 8.25 -> 8
    // Line 3 proportion = 33 * (500/2000) = 8.25 -> 8
    // Total allocated = 32. Leftover = 1.
    // Line 1 is highest value (1000), so it gets +1 = 17.
    dist = currencyUtils.distributeDiscount(33, lines);
    expect(dist).toEqual([
      { id: '1', discountMinor: 17 },
      { id: '2', discountMinor: 8 },
      { id: '3', discountMinor: 8 }
    ]);
  });
});
