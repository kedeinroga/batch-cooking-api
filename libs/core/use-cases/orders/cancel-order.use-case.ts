import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  DataNotFoundException,
  OrderNotEditableException,
  OrderWindowClosedException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { isOrderWindowOpen } from '../../../shared/week-identifier.utils';

export interface CancelOrderInput {
  userId: string;
  orderId: string;
  traceId: string;
}

const CANCELLABLE_STATUSES = new Set([
  OrderStatus.DRAFT,
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.CONFIRMED,
]);

export class CancelOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: CancelOrderInput): Promise<Order> {
    if (!isOrderWindowOpen()) {
      throw new OrderWindowClosedException(
        'Cancellations are no longer allowed after the order window closes',
      );
    }

    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Order does not belong to this user',
      );
    if (!CANCELLABLE_STATUSES.has(order.status)) {
      throw new OrderNotEditableException(
        `Order in status "${order.status}" cannot be cancelled`,
      );
    }

    return this.orderRepository.updateStatus(
      input.orderId,
      OrderStatus.CANCELLED,
    );
  }
}
