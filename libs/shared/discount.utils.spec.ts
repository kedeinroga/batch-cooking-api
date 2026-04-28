import { computeSubtotal, calculateDiscount, resolveDiscountPercentage } from './discount.utils';

describe('computeSubtotal', () => {
  it('returns 0 for empty items', () => {
    expect(computeSubtotal([])).toBe(0);
  });

  it('sums dish and side prices across items', () => {
    const items = [
      { dishPrice: 20, sidePrice: 5 },
      { dishPrice: 18, sidePrice: 0 },
    ];
    expect(computeSubtotal(items)).toBe(43);
  });

  it('handles items with no side (sidePrice 0)', () => {
    expect(computeSubtotal([{ dishPrice: 25, sidePrice: 0 }])).toBe(25);
  });
});

describe('calculateDiscount', () => {
  it('returns zero discount and full subtotal when percentage is 0', () => {
    const result = calculateDiscount(100, 0);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(100);
  });

  it('calculates 10% discount correctly', () => {
    const result = calculateDiscount(200, 10);
    expect(result.discountAmount).toBe(20);
    expect(result.total).toBe(180);
  });

  it('calculates 100% discount', () => {
    const result = calculateDiscount(50, 100);
    expect(result.discountAmount).toBe(50);
    expect(result.total).toBe(0);
  });

  it('does not round — preserves decimal precision (PEN)', () => {
    // 3 items at 18.5 = 55.5, 15% discount = 8.325, total = 47.175
    const result = calculateDiscount(55.5, 15);
    expect(result.discountAmount).toBeCloseTo(8.325, 10);
    expect(result.total).toBeCloseTo(47.175, 10);
  });

  it('handles zero subtotal', () => {
    const result = calculateDiscount(0, 20);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('resolveDiscountPercentage', () => {
  it('returns package discount when sourcePackageId is set', () => {
    const pct = resolveDiscountPercentage('pkg-123', 20, 10);
    expect(pct).toBe(20);
  });

  it('returns general discount when sourcePackageId is null (manual order)', () => {
    const pct = resolveDiscountPercentage(null, 20, 10);
    expect(pct).toBe(10);
  });

  it('returns general discount when sourcePackageId is undefined (package was modified)', () => {
    const pct = resolveDiscountPercentage(undefined, 20, 10);
    expect(pct).toBe(10);
  });

  it('returns general discount when both percentages are 0', () => {
    const pct = resolveDiscountPercentage(null, 0, 0);
    expect(pct).toBe(0);
  });

  it('returns package discount of 0 when package has no discount but sourcePackageId is set', () => {
    const pct = resolveDiscountPercentage('pkg-abc', 0, 15);
    expect(pct).toBe(0);
  });
});
