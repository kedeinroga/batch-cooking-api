import { Order } from '../../domain/entities/order.entity';
import {
  OrderWindowClosedException,
  DataInputException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';
import { isOrderWindowOpen } from '../../../shared/week-identifier.utils';

export interface CreateOrderInput {
  userId: string;
  weekIdentifier: string;
  deliveryAddressId: string;
  traceId: string;
}

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly weeklyConfigRepository: WeeklyConfigRepository,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    if (!isOrderWindowOpen()) {
      throw new OrderWindowClosedException(
        'The order window is currently closed',
      );
    }

    const config = await this.weeklyConfigRepository.findByWeekIdentifier(
      input.weekIdentifier,
    );
    if (!config || !config.isActive) {
      throw new DataInputException(
        `No active weekly config found for week "${input.weekIdentifier}"`,
      );
    }

    return this.orderRepository.create({
      userId: input.userId,
      weekIdentifier: input.weekIdentifier,
      deliveryAddressId: input.deliveryAddressId,
    });
  }
}
