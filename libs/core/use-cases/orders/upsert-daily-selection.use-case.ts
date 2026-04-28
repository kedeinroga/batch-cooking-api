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
import {
  computeSubtotal,
  calculateDiscount,
} from '../../../shared/discount.utils';

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

    // If the order came from a package, modifying an item detaches it from the package
    if (order.sourcePackageId) {
      await this.orderRepository.updateStatus(
        input.orderId,
        OrderStatus.DRAFT,
        { sourcePackageId: undefined },
      );
    }

    const item = await this.orderItemRepository.upsert({
      orderId: input.orderId,
      dayOfWeek: input.dayOfWeek,
      mealType: input.mealType,
      dishId: input.dishId,
      sideId: input.sideId,
    });

    // Recalculate totals so the DRAFT order reflects the current selection.
    // sourcePackageId is always null here (cleared above or was never set),
    // so the general weekly discount applies.
    const orderWithItems = await this.orderRepository.findByIdWithItems(
      input.orderId,
    );
    const subtotal = computeSubtotal(
      (orderWithItems?.items ?? []).map((i) => ({
        dishPrice: (i as any).dishPrice ?? 0,
        sidePrice: (i as any).sidePrice ?? 0,
      })),
    );
    const config = await this.weeklyConfigRepository.findByWeekIdentifier(
      order.weekIdentifier,
    );
    const { discountAmount, total } = calculateDiscount(
      subtotal,
      config?.discountPercentage ?? 0,
    );
    await this.orderRepository.updateStatus(input.orderId, OrderStatus.DRAFT, {
      subtotal,
      discountApplied: discountAmount,
      total,
    });

    return item;
  }
}
