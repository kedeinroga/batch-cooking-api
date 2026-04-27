import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  DataNotFoundException,
  OrderNotEditableException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';

export interface DeleteDraftOrderInput {
  userId: string;
  orderId: string;
  traceId: string;
}

export class DeleteDraftOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: DeleteDraftOrderInput): Promise<void> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Order does not belong to this user',
      );
    if (order.status !== OrderStatus.DRAFT) {
      throw new OrderNotEditableException('Only DRAFT orders can be deleted');
    }

    await this.orderRepository.deleteById(input.orderId);
  }
}
