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
import {
  computeSubtotal,
  calculateDiscount,
} from '../../../shared/discount.utils';

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

    // Removing an item detaches the order from its package
    if (order.sourcePackageId) {
      await this.orderRepository.updateStatus(
        input.orderId,
        OrderStatus.DRAFT,
        { sourcePackageId: undefined },
      );
    }

    await this.orderItemRepository.deleteByDayAndMeal(
      input.orderId,
      input.dayOfWeek,
      input.mealType,
    );

    // Recalculate totals with general weekly discount (sourcePackageId is now null)
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

    return this.orderRepository.updateStatus(input.orderId, OrderStatus.DRAFT, {
      subtotal,
      discountApplied: discountAmount,
      total,
    });
  }
}
