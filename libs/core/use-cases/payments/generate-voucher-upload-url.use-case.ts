import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  DataNotFoundException,
  OrderNotEditableException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { StorageService } from '../../domain-services/services/storage.service';

const UPLOAD_URL_EXPIRY_SECONDS = 10 * 60; // 10 minutes

export interface GenerateVoucherUploadUrlInput {
  userId: string;
  orderId: string;
  traceId: string;
}

export interface GenerateVoucherUploadUrlOutput {
  uploadUrl: string;
  objectName: string;
}

export class GenerateVoucherUploadUrlUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    input: GenerateVoucherUploadUrlInput,
  ): Promise<GenerateVoucherUploadUrlOutput> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Order does not belong to this user',
      );
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new OrderNotEditableException(
        'Voucher upload is only allowed for orders in PENDING_PAYMENT status',
      );
    }

    const objectName = `vouchers/${input.orderId}/${Date.now()}.jpg`;
    const uploadUrl = await this.storageService.generateUploadUrl(
      objectName,
      UPLOAD_URL_EXPIRY_SECONDS,
    );

    return { uploadUrl, objectName };
  }
}
