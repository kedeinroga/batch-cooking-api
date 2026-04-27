import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  DataNotFoundException,
  OrderNotEditableException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';

export interface ConfirmPaymentInput {
  orderId: string;
  traceId: string;
}

export class ConfirmPaymentUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ConfirmPaymentInput): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new OrderNotEditableException(
        'Only orders in PENDING_PAYMENT status can be confirmed',
      );
    }

    return this.orderRepository.updateStatus(
      input.orderId,
      OrderStatus.CONFIRMED,
    );
  }
}
