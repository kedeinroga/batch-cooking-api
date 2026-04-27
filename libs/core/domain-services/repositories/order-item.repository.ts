import { OrderItem } from '../../domain/entities/order-item.entity';
import { MealType } from '../../domain/enums/meal-type.enum';

export interface UpsertOrderItemInput {
  orderId: string;
  dayOfWeek: number;
  mealType: MealType;
  dishId: string;
  sideId?: string;
}

export abstract class OrderItemRepository {
  abstract findByOrder(orderId: string): Promise<OrderItem[]>;
  abstract upsert(data: UpsertOrderItemInput): Promise<OrderItem>;
  abstract deleteByOrder(orderId: string): Promise<void>;
  abstract replaceAll(
    orderId: string,
    items: UpsertOrderItemInput[],
  ): Promise<OrderItem[]>;
}
