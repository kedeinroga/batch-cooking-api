import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderRepository } from '../../domain-services/repositories/order.repository';

export interface GenerateProductionReportInput {
  weekIdentifier: string;
  traceId: string;
}

export interface GenerateProductionReportOutput {
  weekIdentifier: string;
  totalOrders: number;
  orders: Order[];
}

export class GenerateProductionReportUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(
    input: GenerateProductionReportInput,
  ): Promise<GenerateProductionReportOutput> {
    const orders = await this.orderRepository.findByWeekAndStatus(
      input.weekIdentifier,
      [OrderStatus.CONFIRMED],
    );

    return {
      weekIdentifier: input.weekIdentifier,
      totalOrders: orders.length,
      orders,
    };
  }
}
