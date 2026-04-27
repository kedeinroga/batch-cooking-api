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

    return this.orderItemRepository.upsert({
      orderId: input.orderId,
      dayOfWeek: input.dayOfWeek,
      mealType: input.mealType,
      dishId: input.dishId,
      sideId: input.sideId,
    });
  }
}
