import { Order } from '../../domain/entities/order.entity';
import { DataInputException } from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';

export interface ListUserOrdersInput {
  userId: string;
  weekIdentifier: string;
  traceId: string;
}

export class ListUserOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ListUserOrdersInput): Promise<Order[]> {
    if (!/^\d{4}-W\d{2}$/.test(input.weekIdentifier)) {
      throw new DataInputException(
        'Invalid weekIdentifier format. Expected: YYYY-WNN',
      );
    }
    return this.orderRepository.findByUserAndWeek(
      input.userId,
      input.weekIdentifier,
    );
  }
}
