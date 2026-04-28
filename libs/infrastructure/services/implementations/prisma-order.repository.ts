import { Prisma } from '@prisma/client';
import { Order } from '../../../core/domain/entities/order.entity';
import { OrderStatus } from '../../../core/domain/enums/order-status.enum';
import {
  OrderRepository,
  CreateOrderInput,
} from '../../../core/domain-services/repositories/order.repository';
import { DataSourceException } from '../../../core/domain/exceptions/batch-cooking.exceptions';
import { PrismaService } from '../custom/prisma.service';
import { OrderMapper } from './mappers/order.mapper';
import { OrderItemMapper } from './mappers/order-item.mapper';

// Statuses that consume capacity (PRD §5.2)
const CAPACITY_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.CONFIRMED,
  OrderStatus.DELIVERED,
];

type PrismaTransactionClient = Prisma.TransactionClient;

export class PrismaOrderRepository extends OrderRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateOrderInput): Promise<Order> {
    try {
      const record = await this.prisma.order.create({
        data: {
          userId: data.userId,
          weekIdentifier: data.weekIdentifier,
          deliveryAddressId: data.deliveryAddressId,
        },
      });
      return OrderMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to create order: ${(err as Error).message}`,
      );
    }
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const record = await this.prisma.order.findUnique({ where: { id } });
      return record ? OrderMapper.toDomain(record) : null;
    } catch (err) {
      throw new DataSourceException(
        `Failed to find order: ${(err as Error).message}`,
      );
    }
  }

  async findByIdWithItems(id: string): Promise<Order | null> {
    try {
      const record = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              dish: true,
              side: true,
            },
          },
        },
      });
      if (!record) return null;

      const order = OrderMapper.toDomain(record);
      order.items = record.items.map((item) => {
        const domainItem = OrderItemMapper.toDomain(item);
        // Attach prices so InitiateCheckoutUseCase can compute subtotal
        (domainItem as any).dishPrice = item.dish.price.toNumber();
        (domainItem as any).sidePrice = item.side?.price.toNumber() ?? 0;
        return domainItem;
      });
      return order;
    } catch (err) {
      throw new DataSourceException(
        `Failed to find order with items: ${(err as Error).message}`,
      );
    }
  }

  async findByUserAndWeek(
    userId: string,
    weekIdentifier: string,
  ): Promise<Order[]> {
    try {
      const records = await this.prisma.order.findMany({
        where: { userId, weekIdentifier },
      });
      return records.map(OrderMapper.toDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to find orders by user and week: ${(err as Error).message}`,
      );
    }
  }

  async findByWeekAndStatus(
    weekIdentifier: string,
    statuses: OrderStatus[],
  ): Promise<Order[]> {
    try {
      const records = await this.prisma.order.findMany({
        where: {
          weekIdentifier,
          status: { in: statuses },
        },
        include: { items: true },
      });
      return records.map((record) => {
        const order = OrderMapper.toDomain(record);
        order.items = record.items.map(OrderItemMapper.toDomain);
        return order;
      });
    } catch (err) {
      throw new DataSourceException(
        `Failed to find orders by week and status: ${(err as Error).message}`,
      );
    }
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    extra?: Partial<Order>,
  ): Promise<Order> {
    try {
      const e = extra ?? {};
      const record = await this.prisma.order.update({
        where: { id },
        data: {
          status,
          ...('sourcePackageId' in e && {
            sourcePackageId: e.sourcePackageId ?? null,
          }),
          ...('appliedPackageId' in e && {
            appliedPackageId: e.appliedPackageId ?? null,
          }),
          ...('voucherPath' in e && {
            voucherPath: e.voucherPath ?? null,
          }),
          ...('ticketNumber' in e && { ticketNumber: e.ticketNumber }),
          ...('subtotal' in e && { subtotal: e.subtotal }),
          ...('discountApplied' in e && { discountApplied: e.discountApplied }),
          ...('total' in e && { total: e.total }),
          ...('deliveredAt' in e && { deliveredAt: e.deliveredAt }),
        },
      });
      return OrderMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to update order status: ${(err as Error).message}`,
      );
    }
  }

  async countConfirmedByWeek(
    weekIdentifier: string,
    tx?: unknown,
  ): Promise<number> {
    try {
      const client = (tx as PrismaTransactionClient) ?? this.prisma;
      return client.order.count({
        where: {
          weekIdentifier,
          status: { in: CAPACITY_STATUSES },
        },
      });
    } catch (err) {
      throw new DataSourceException(
        `Failed to count confirmed orders: ${(err as Error).message}`,
      );
    }
  }

  async updateWithTransaction(
    id: string,
    data: Partial<Order>,
    txOrCallback: unknown,
  ): Promise<Order> {
    // If called with a callback, open a new transaction and invoke it
    if (typeof txOrCallback === 'function') {
      try {
        return await this.prisma.$transaction(async (tx) => {
          return (txOrCallback as (tx: unknown) => Promise<Order>)(tx);
        });
      } catch (err) {
        if (err instanceof Error && err.constructor.name.endsWith('Exception'))
          throw err;
        throw new DataSourceException(
          `Transaction failed: ${(err as Error).message}`,
        );
      }
    }

    // If called with an existing tx client, update directly
    try {
      const client = (txOrCallback as PrismaTransactionClient) ?? this.prisma;
      const record = await client.order.update({
        where: { id },
        data: {
          ...('status' in data && { status: data.status }),
          ...('sourcePackageId' in data && {
            sourcePackageId: data.sourcePackageId ?? null,
          }),
          ...('appliedPackageId' in data && {
            appliedPackageId: data.appliedPackageId ?? null,
          }),
          ...('voucherPath' in data && {
            voucherPath: data.voucherPath ?? null,
          }),
          ...('ticketNumber' in data && { ticketNumber: data.ticketNumber }),
          ...('subtotal' in data && { subtotal: data.subtotal }),
          ...('discountApplied' in data && {
            discountApplied: data.discountApplied,
          }),
          ...('total' in data && { total: data.total }),
          ...('deliveredAt' in data && { deliveredAt: data.deliveredAt }),
        },
      });
      return OrderMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to update order in transaction: ${(err as Error).message}`,
      );
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.orderItem.deleteMany({ where: { orderId: id } }),
        this.prisma.order.delete({ where: { id } }),
      ]);
    } catch (err) {
      throw new DataSourceException(
        `Failed to delete order: ${(err as Error).message}`,
      );
    }
  }

  async nextTicketSequential(
    weekIdentifier: string,
    tx: unknown,
  ): Promise<number> {
    try {
      const client = (tx as PrismaTransactionClient) ?? this.prisma;
      const count = await client.order.count({
        where: {
          weekIdentifier,
          ticketNumber: { not: null },
        },
      });
      return count + 1;
    } catch (err) {
      throw new DataSourceException(
        `Failed to get next ticket sequential: ${(err as Error).message}`,
      );
    }
  }

  async findOrdersWithDeliveredVouchers(
    olderThanDays: number,
  ): Promise<Order[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const records = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.DELIVERED,
          deliveredAt: { lte: cutoffDate },
          voucherPath: { not: null },
        },
      });
      return records.map(OrderMapper.toDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to find expired voucher orders: ${(err as Error).message}`,
      );
    }
  }
}
