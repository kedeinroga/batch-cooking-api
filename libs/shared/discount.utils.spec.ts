import { computeSubtotal, calculateDiscount, resolveDiscountPercentage, hasAllLunches, itemsMatchPackage } from './discount.utils';

const lunch = (day: number) => ({ dayOfWeek: day, mealType: 'LUNCH' });
const dinner = (day: number) => ({ dayOfWeek: day, mealType: 'DINNER' });
const allLunches = [1, 2, 3, 4, 5].map(lunch);

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

describe('hasAllLunches', () => {
  it('returns true when all 5 weekdays have a lunch', () => {
    expect(hasAllLunches(allLunches)).toBe(true);
  });

  it('returns true when all 5 lunches are present alongside dinners', () => {
    const items = [1, 2, 3, 4, 5].flatMap((d) => [lunch(d), dinner(d)]);
    expect(hasAllLunches(items)).toBe(true);
  });

  it('returns false when one lunch is missing', () => {
    const items = [1, 2, 3, 4].map(lunch); // missing day 5
    expect(hasAllLunches(items)).toBe(false);
  });

  it('returns false for an empty list', () => {
    expect(hasAllLunches([])).toBe(false);
  });

  it('returns false when only dinners are present', () => {
    expect(hasAllLunches([1, 2, 3, 4, 5].map(dinner))).toBe(false);
  });

  it('returns false when a day has only dinner but no lunch', () => {
    const items = [lunch(1), lunch(2), lunch(3), lunch(4), dinner(5)];
    expect(hasAllLunches(items)).toBe(false);
  });
});

describe('itemsMatchPackage', () => {
  const pkg = [
    { dayOfWeek: 1, mealType: 'LUNCH', dishId: 'd1', sideId: 's1' },
    { dayOfWeek: 2, mealType: 'LUNCH', dishId: 'd2', sideId: null },
    { dayOfWeek: 3, mealType: 'DINNER', dishId: 'd3', sideId: 's3' },
  ];

  it('returns true when order items match the package exactly', () => {
    expect(itemsMatchPackage([...pkg], pkg)).toBe(true);
  });

  it('returns true regardless of item order', () => {
    const reversed = [...pkg].reverse();
    expect(itemsMatchPackage(reversed, pkg)).toBe(true);
  });

  it('returns false when order has fewer items than the package', () => {
    expect(itemsMatchPackage(pkg.slice(0, 2), pkg)).toBe(false);
  });

  it('returns false when order has more items than the package', () => {
    const extra = [...pkg, { dayOfWeek: 4, mealType: 'LUNCH', dishId: 'd4', sideId: null }];
    expect(itemsMatchPackage(extra, pkg)).toBe(false);
  });

  it('returns false when a dish differs', () => {
    const modified = pkg.map((i, idx) =>
      idx === 0 ? { ...i, dishId: 'other-dish' } : i,
    );
    expect(itemsMatchPackage(modified, pkg)).toBe(false);
  });

  it('returns false when a side differs', () => {
    const modified = pkg.map((i, idx) =>
      idx === 0 ? { ...i, sideId: 'other-side' } : i,
    );
    expect(itemsMatchPackage(modified, pkg)).toBe(false);
  });

  it('returns false for empty order against non-empty package', () => {
    expect(itemsMatchPackage([], pkg)).toBe(false);
  });

  it('returns true for two empty lists', () => {
    expect(itemsMatchPackage([], [])).toBe(true);
  });
});

describe('resolveDiscountPercentage', () => {
  it('returns package discount when sourcePackageId is set, regardless of lunches', () => {
    expect(resolveDiscountPercentage('pkg-123', 20, 10, [])).toBe(20);
    expect(resolveDiscountPercentage('pkg-123', 20, 10, allLunches)).toBe(20);
  });

  it('returns general discount when all 5 lunches are present (manual order)', () => {
    expect(resolveDiscountPercentage(null, 20, 10, allLunches)).toBe(10);
  });

  it('returns 0 when not all lunches are present (manual order)', () => {
    expect(resolveDiscountPercentage(null, 20, 10, [lunch(1), lunch(2)])).toBe(0);
  });

  it('returns 0 when items are empty', () => {
    expect(resolveDiscountPercentage(null, 20, 10, [])).toBe(0);
  });

  it('returns 0 when package was modified (sourcePackageId null) and lunches incomplete', () => {
    expect(resolveDiscountPercentage(undefined, 20, 10, [lunch(1)])).toBe(0);
  });

  it('returns general discount when package was modified and all lunches present', () => {
    expect(resolveDiscountPercentage(undefined, 20, 10, allLunches)).toBe(10);
  });

  it('returns package discount of 0 when package has no discount but sourcePackageId is set', () => {
    expect(resolveDiscountPercentage('pkg-abc', 0, 15, allLunches)).toBe(0);
  });
});
