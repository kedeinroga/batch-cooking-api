import { OrderItem as PrismaOrderItem } from '@prisma/client';
import { OrderItem } from '../../../../core/domain/entities/order-item.entity';
import { MealType } from '../../../../core/domain/enums/meal-type.enum';

export class OrderItemMapper {
  static toDomain(record: PrismaOrderItem): OrderItem {
    return {
      id: record.id,
      orderId: record.orderId,
      dayOfWeek: record.dayOfWeek,
      mealType: record.mealType as MealType,
      dishId: record.dishId,
      sideId: record.sideId ?? undefined,
    };
  }
}
