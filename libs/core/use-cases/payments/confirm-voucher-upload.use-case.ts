import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  DataNotFoundException,
  DataInputException,
  OrderNotEditableException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';

export interface ConfirmVoucherUploadInput {
  userId: string;
  orderId: string;
  objectName: string;
  traceId: string;
}

export class ConfirmVoucherUploadUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: ConfirmVoucherUploadInput): Promise<Order> {
    if (!input.objectName?.trim()) {
      throw new DataInputException('objectName is required');
    }

    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Order does not belong to this user',
      );
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new OrderNotEditableException(
        'Voucher confirmation is only allowed for orders in PENDING_PAYMENT status',
      );
    }

    return this.orderRepository.updateStatus(
      input.orderId,
      OrderStatus.PENDING_PAYMENT,
      {
        voucherPath: input.objectName,
      },
    );
  }
}
