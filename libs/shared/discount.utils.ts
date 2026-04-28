/**
 * Sums item prices to compute the order subtotal.
 * dishPrice and sidePrice come from findByIdWithItems (joined via catalog_dishes).
 */
export function computeSubtotal(
  items: { dishPrice: number; sidePrice: number }[],
): number {
  return items.reduce((sum, i) => sum + i.dishPrice + i.sidePrice, 0);
}

/**
 * Calculates the discount amount and final total given a subtotal and a percentage.
 * No rounding — currency is PEN and the PRD explicitly forbids rounding.
 *
 * @param subtotal           - sum of all order item prices
 * @param discountPercentage - percentage (0–100)
 * @returns { discountAmount, total }
 */
export function calculateDiscount(
  subtotal: number,
  discountPercentage: number,
): { discountAmount: number; total: number } {
  const discountAmount = subtotal * (discountPercentage / 100);
  const total = subtotal - discountAmount;
  return { discountAmount, total };
}

/**
 * Determines which discount percentage to apply based on the order's origin.
 *
 * Rules (PRD §5.4):
 * - Package with NO modifications  → package discount
 * - Package WITH modifications      → general (weekly config) discount
 * - Built manually (no package)     → general (weekly config) discount
 *
 * @param sourcePackageId       - null if manual or if package was modified
 * @param packageDiscountPct    - discount from the original package
 * @param generalDiscountPct    - discount from weekly_configs
 */
export function resolveDiscountPercentage(
  sourcePackageId: string | undefined | null,
  packageDiscountPct: number,
  generalDiscountPct: number,
): number {
  if (sourcePackageId) {
    return packageDiscountPct;
  }
  return generalDiscountPct;
}
