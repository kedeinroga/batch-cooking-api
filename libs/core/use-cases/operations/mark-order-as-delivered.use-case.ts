import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  DataNotFoundException,
  OrderNotEditableException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';

export interface MarkOrderAsDeliveredInput {
  orderId: string;
  traceId: string;
}

export class MarkOrderAsDeliveredUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: MarkOrderAsDeliveredInput): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new OrderNotEditableException(
        'Only CONFIRMED orders can be marked as delivered',
      );
    }

    return this.orderRepository.updateStatus(
      input.orderId,
      OrderStatus.DELIVERED,
      {
        deliveredAt: new Date(),
      },
    );
  }
}
