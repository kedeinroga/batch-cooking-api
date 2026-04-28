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
 * Returns true when all 5 weekdays (1–5) have at least one LUNCH item.
 * Required to qualify for the general weekly discount.
 */
export function hasAllLunches(
  items: { dayOfWeek: number; mealType: string }[],
): boolean {
  return [1, 2, 3, 4, 5].every((day) =>
    items.some((i) => i.dayOfWeek === day && i.mealType === 'LUNCH'),
  );
}

/**
 * Returns true when every order item matches a package item exactly
 * (same dayOfWeek, mealType, dishId, sideId) and the counts are equal.
 * Used to determine whether to restore the package discount after an item change.
 */
export function itemsMatchPackage(
  orderItems: { dayOfWeek: number; mealType: string; dishId: string; sideId?: string | null }[],
  packageItems: { dayOfWeek: number; mealType: string; dishId: string; sideId?: string | null }[],
): boolean {
  if (orderItems.length !== packageItems.length) return false;
  const key = (i: { dayOfWeek: number; mealType: string; dishId: string; sideId?: string | null }) =>
    `${i.dayOfWeek}|${i.mealType}|${i.dishId}|${i.sideId ?? ''}`;
  const pkgKeys = new Set(packageItems.map(key));
  return orderItems.every((i) => pkgKeys.has(key(i)));
}

/**
 * Determines which discount percentage to apply.
 *
 * Rules (PRD §5.4):
 * - Package with NO modifications  → package discount (always)
 * - Package WITH modifications      → general discount only if all 5 lunches present, else 0
 * - Built manually                  → general discount only if all 5 lunches present, else 0
 *
 * @param sourcePackageId    - null/undefined if manual or package was modified
 * @param packageDiscountPct - discount from the original package
 * @param generalDiscountPct - discount from weekly_configs
 * @param items              - current order items (checked for lunch completeness)
 */
export function resolveDiscountPercentage(
  sourcePackageId: string | undefined | null,
  packageDiscountPct: number,
  generalDiscountPct: number,
  items: { dayOfWeek: number; mealType: string }[],
): number {
  if (sourcePackageId) {
    return packageDiscountPct;
  }
  return hasAllLunches(items) ? generalDiscountPct : 0;
}
