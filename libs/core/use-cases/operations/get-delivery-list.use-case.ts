import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  OrderRepository,
  DeliveryListItem,
} from '../../domain-services/repositories/order.repository';

export interface GetDeliveryListInput {
  weekIdentifier: string;
  traceId: string;
}

export interface GetDeliveryListOutput {
  weekIdentifier: string;
  items: DeliveryListItem[];
}

export class GetDeliveryListUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: GetDeliveryListInput): Promise<GetDeliveryListOutput> {
    const items = await this.orderRepository.findDeliveryItemsByWeek(
      input.weekIdentifier,
      [OrderStatus.CONFIRMED, OrderStatus.DELIVERED],
    );

    return {
      weekIdentifier: input.weekIdentifier,
      items,
    };
  }
}
