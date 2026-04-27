import { OrderItem } from '../../../core/domain/entities/order-item.entity';
import {
  OrderItemRepository,
  UpsertOrderItemInput,
} from '../../../core/domain-services/repositories/order-item.repository';
import { DataSourceException } from '../../../core/domain/exceptions/batch-cooking.exceptions';
import { PrismaService } from '../custom/prisma.service';
import { OrderItemMapper } from './mappers/order-item.mapper';

export class PrismaOrderItemRepository extends OrderItemRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByOrder(orderId: string): Promise<OrderItem[]> {
    try {
      const records = await this.prisma.orderItem.findMany({
        where: { orderId },
      });
      return records.map(OrderItemMapper.toDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to find order items: ${(err as Error).message}`,
      );
    }
  }

  async upsert(data: UpsertOrderItemInput): Promise<OrderItem> {
    try {
      const record = await this.prisma.orderItem.upsert({
        where: {
          orderId_dayOfWeek_mealType: {
            orderId: data.orderId,
            dayOfWeek: data.dayOfWeek,
            mealType: data.mealType,
          },
        },
        update: { dishId: data.dishId, sideId: data.sideId ?? null },
        create: {
          orderId: data.orderId,
          dayOfWeek: data.dayOfWeek,
          mealType: data.mealType,
          dishId: data.dishId,
          sideId: data.sideId,
        },
      });
      return OrderItemMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to upsert order item: ${(err as Error).message}`,
      );
    }
  }

  async deleteByOrder(orderId: string): Promise<void> {
    try {
      await this.prisma.orderItem.deleteMany({ where: { orderId } });
    } catch (err) {
      throw new DataSourceException(
        `Failed to delete order items: ${(err as Error).message}`,
      );
    }
  }

  async replaceAll(
    orderId: string,
    items: UpsertOrderItemInput[],
  ): Promise<OrderItem[]> {
    try {
      await this.prisma.orderItem.deleteMany({ where: { orderId } });
      const created = await this.prisma.$transaction(
        items.map((item) =>
          this.prisma.orderItem.create({
            data: {
              orderId: item.orderId,
              dayOfWeek: item.dayOfWeek,
              mealType: item.mealType,
              dishId: item.dishId,
              sideId: item.sideId,
            },
          }),
        ),
      );
      return created.map(OrderItemMapper.toDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to replace order items: ${(err as Error).message}`,
      );
    }
  }
}
