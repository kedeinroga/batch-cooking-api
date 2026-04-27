import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderRepository } from '../../domain-services/repositories/order.repository';

export interface ListPendingPaymentOrdersInput {
  weekIdentifier: string;
  traceId: string;
}

export interface ListPendingPaymentOrdersOutput {
  weekIdentifier: string;
  totalOrders: number;
  orders: Order[];
}

export class ListPendingPaymentOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(
    input: ListPendingPaymentOrdersInput,
  ): Promise<ListPendingPaymentOrdersOutput> {
    const orders = await this.orderRepository.findByWeekAndStatus(
      input.weekIdentifier,
      [OrderStatus.PENDING_PAYMENT],
    );

    return {
      weekIdentifier: input.weekIdentifier,
      totalOrders: orders.length,
      orders,
    };
  }
}
