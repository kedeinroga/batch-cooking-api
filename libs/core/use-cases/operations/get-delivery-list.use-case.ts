import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderRepository } from '../../domain-services/repositories/order.repository';

export interface GetDeliveryListInput {
  weekIdentifier: string;
  traceId: string;
}

export interface GetDeliveryListOutput {
  weekIdentifier: string;
  totalOrders: number;
  orders: Order[];
}

export class GetDeliveryListUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: GetDeliveryListInput): Promise<GetDeliveryListOutput> {
    const orders = await this.orderRepository.findByWeekAndStatus(
      input.weekIdentifier,
      [OrderStatus.CONFIRMED, OrderStatus.DELIVERED],
    );

    return {
      weekIdentifier: input.weekIdentifier,
      totalOrders: orders.length,
      orders,
    };
  }
}
