import {
  DataNotFoundException,
  DataInputException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { StorageService } from '../../domain-services/services/storage.service';

const READ_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes

export interface GetVoucherSignedUrlInput {
  orderId: string;
  traceId: string;
}

export interface GetVoucherSignedUrlOutput {
  signedUrl: string;
}

export class GetVoucherSignedUrlUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    input: GetVoucherSignedUrlInput,
  ): Promise<GetVoucherSignedUrlOutput> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (!order.voucherPath)
      throw new DataInputException('This order has no voucher uploaded');

    const signedUrl = await this.storageService.generateReadUrl(
      order.voucherPath,
      READ_URL_EXPIRY_SECONDS,
    );
    return { signedUrl };
  }
}
