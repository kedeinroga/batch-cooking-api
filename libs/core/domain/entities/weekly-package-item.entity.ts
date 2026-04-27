import { MealType } from '../enums/meal-type.enum';

export class WeeklyPackageItem {
  id: string;
  packageId: string;
  dayOfWeek: number;
  mealType: MealType;
  dishId: string;
  sideId?: string;
}
