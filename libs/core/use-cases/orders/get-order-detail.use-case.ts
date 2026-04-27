import { Order } from '../../domain/entities/order.entity';
import {
  DataNotFoundException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';

export interface GetOrderDetailInput {
  userId: string;
  orderId: string;
  traceId: string;
}

export class GetOrderDetailUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: GetOrderDetailInput): Promise<Order> {
    const order = await this.orderRepository.findByIdWithItems(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Order does not belong to this user',
      );
    return order;
  }
}
