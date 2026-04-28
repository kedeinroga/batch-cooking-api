import { Order } from '../../domain/entities/order.entity';
import { MealType } from '../../domain/enums/meal-type.enum';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  DataNotFoundException,
  OrderNotEditableException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { OrderItemRepository } from '../../domain-services/repositories/order-item.repository';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';
import { WeeklyPackageRepository } from '../../domain-services/repositories/weekly-package.repository';
import { itemsMatchPackage } from '../../../shared/discount.utils';
import { recalculateOrderTotals } from './recalculate-order-totals';

export interface RemoveOrderItemInput {
  userId: string;
  orderId: string;
  dayOfWeek: number;
  mealType: MealType;
  traceId: string;
}

export class RemoveOrderItemUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly weeklyConfigRepository: WeeklyConfigRepository,
    private readonly weeklyPackageRepository: WeeklyPackageRepository,
  ) {}

  async execute(input: RemoveOrderItemInput): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Order does not belong to this user',
      );
    if (order.status !== OrderStatus.DRAFT)
      throw new OrderNotEditableException('Order is not in DRAFT status');

    await this.orderItemRepository.deleteByDayAndMeal(
      input.orderId,
      input.dayOfWeek,
      input.mealType,
    );

    // A removed item almost never leaves the order matching the package, but we
    // run the same comparison logic for symmetry (e.g. removing a dinner item
    // that was not in the package still leaves lunches intact).
    let newSourcePackageId: string | null = null;
    let newPackageDiscountPct = 0;

    if (order.appliedPackageId) {
      const pkg = await this.weeklyPackageRepository.findWithItems(
        order.appliedPackageId,
      );
      if (pkg) {
        const fresh = await this.orderRepository.findByIdWithItems(
          input.orderId,
        );
        if (itemsMatchPackage(fresh?.items ?? [], pkg.items)) {
          newSourcePackageId = order.appliedPackageId;
          newPackageDiscountPct = pkg.discountPercentage;
        }
      }
    }

    return recalculateOrderTotals(
      input.orderId,
      order.weekIdentifier,
      newSourcePackageId,
      newPackageDiscountPct,
      this.orderRepository,
      this.weeklyConfigRepository,
    );
  }
}
