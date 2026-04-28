import { Order as PrismaOrder } from '@prisma/client';
import { Order } from '../../../../core/domain/entities/order.entity';
import { OrderStatus } from '../../../../core/domain/enums/order-status.enum';

export class OrderMapper {
  static toDomain(record: PrismaOrder): Order {
    return {
      id: record.id,
      userId: record.userId,
      weekIdentifier: record.weekIdentifier,
      deliveryAddressId: record.deliveryAddressId,
      sourcePackageId: record.sourcePackageId ?? undefined,
      appliedPackageId: record.appliedPackageId ?? undefined,
      subtotal: record.subtotal?.toNumber() ?? 0,
      discountApplied: record.discountApplied?.toNumber() ?? 0,
      total: record.total?.toNumber() ?? 0,
      status: record.status as OrderStatus,
      ticketNumber: record.ticketNumber ?? undefined,
      voucherPath: record.voucherPath ?? undefined,
      deliveredAt: record.deliveredAt ?? undefined,
    };
  }
}
