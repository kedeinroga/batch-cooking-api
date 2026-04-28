import { OrderItem } from '../../domain/entities/order-item.entity';
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

export interface UpsertDailySelectionInput {
  userId: string;
  orderId: string;
  dayOfWeek: number;
  mealType: MealType;
  dishId: string;
  sideId?: string;
  traceId: string;
}

export class UpsertDailySelectionUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly weeklyConfigRepository: WeeklyConfigRepository,
    private readonly weeklyPackageRepository: WeeklyPackageRepository,
  ) {}

  async execute(input: UpsertDailySelectionInput): Promise<OrderItem> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Order does not belong to this user',
      );
    if (order.status !== OrderStatus.DRAFT)
      throw new OrderNotEditableException('Order is not in DRAFT status');

    const item = await this.orderItemRepository.upsert({
      orderId: input.orderId,
      dayOfWeek: input.dayOfWeek,
      mealType: input.mealType,
      dishId: input.dishId,
      sideId: input.sideId,
    });

    // Determine if the order still matches the originally applied package.
    // If it does, restore sourcePackageId so the package discount applies again.
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

    await recalculateOrderTotals(
      input.orderId,
      order.weekIdentifier,
      newSourcePackageId,
      newPackageDiscountPct,
      this.orderRepository,
      this.weeklyConfigRepository,
    );

    return item;
  }
}
