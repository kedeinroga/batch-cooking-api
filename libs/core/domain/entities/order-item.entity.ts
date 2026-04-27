import { MealType } from '../enums/meal-type.enum';

export class OrderItem {
  id: string;
  orderId: string;
  dayOfWeek: number;
  mealType: MealType;
  dishId: string;
  sideId?: string;
}
