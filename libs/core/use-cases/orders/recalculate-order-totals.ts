import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';
import {
  computeSubtotal,
  calculateDiscount,
  resolveDiscountPercentage,
} from '../../../shared/discount.utils';

/**
 * Recomputes subtotal/discountApplied/total for a DRAFT order and persists them.
 *
 * Discount rules (PRD §5.4):
 *   - sourcePackageId set   → packageDiscountPct (always)
 *   - sourcePackageId null  → generalDiscountPct only if all 5 lunches present, else 0
 *
 * Callers are responsible for passing the correct sourcePackageId *after* any
 * mutations (e.g. already cleared when an item is modified, already set when a
 * package is applied).
 */
export async function recalculateOrderTotals(
  orderId: string,
  weekIdentifier: string,
  sourcePackageId: string | null | undefined,
  packageDiscountPct: number,
  orderRepository: OrderRepository,
  weeklyConfigRepository: WeeklyConfigRepository,
): Promise<Order> {
  const orderWithItems = await orderRepository.findByIdWithItems(orderId);
  const items = orderWithItems?.items ?? [];
  const subtotal = computeSubtotal(
    items.map((i) => ({
      dishPrice: (i as any).dishPrice ?? 0,
      sidePrice: (i as any).sidePrice ?? 0,
    })),
  );
  const config =
    await weeklyConfigRepository.findByWeekIdentifier(weekIdentifier);
  const discountPct = resolveDiscountPercentage(
    sourcePackageId,
    packageDiscountPct,
    config?.discountPercentage ?? 0,
    items,
  );
  const { discountAmount, total } = calculateDiscount(subtotal, discountPct);
  return orderRepository.updateStatus(orderId, OrderStatus.DRAFT, {
    sourcePackageId: sourcePackageId ?? undefined,
    subtotal,
    discountApplied: discountAmount,
    total,
  });
}
