import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { StorageService } from '../../domain-services/services/storage.service';

const VOUCHER_RETENTION_DAYS = 30;

export interface CleanupExpiredVouchersInput {
  traceId: string;
}

export interface CleanupExpiredVouchersOutput {
  deletedCount: number;
  errors: string[];
}

export class CleanupExpiredVouchersUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    input: CleanupExpiredVouchersInput,
  ): Promise<CleanupExpiredVouchersOutput> {
    const orders = await this.orderRepository.findOrdersWithDeliveredVouchers(
      VOUCHER_RETENTION_DAYS,
    );

    let deletedCount = 0;
    const errors: string[] = [];

    for (const order of orders) {
      if (!order.voucherPath) continue;
      try {
        await this.storageService.delete(order.voucherPath);
        await this.orderRepository.updateStatus(order.id, order.status, {
          voucherPath: undefined,
        });
        deletedCount++;
      } catch (err) {
        errors.push(
          `Failed to delete voucher for order ${order.id}: ${(err as Error).message}`,
        );
      }
    }

    return { deletedCount, errors };
  }
}
