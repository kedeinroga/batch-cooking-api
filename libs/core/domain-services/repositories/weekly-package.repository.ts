import { WeeklyPackage } from '../../domain/entities/weekly-package.entity';
import { WeeklyPackageItem } from '../../domain/entities/weekly-package-item.entity';
import { MealType } from '../../domain/enums/meal-type.enum';

export interface UpsertWeeklyPackageInput {
  id?: string;
  weekIdentifier: string;
  name: string;
  description?: string;
  discountPercentage: number;
}

export interface UpsertPackageItemInput {
  packageId: string;
  dayOfWeek: number;
  mealType: MealType;
  dishId: string;
  sideId?: string;
}

export abstract class WeeklyPackageRepository {
  abstract findById(id: string): Promise<WeeklyPackage | null>;
  abstract findByWeek(weekIdentifier: string): Promise<WeeklyPackage[]>;
  abstract findWithItems(
    id: string,
  ): Promise<(WeeklyPackage & { items: WeeklyPackageItem[] }) | null>;
  abstract upsert(data: UpsertWeeklyPackageInput): Promise<WeeklyPackage>;
  abstract upsertItems(
    packageId: string,
    items: UpsertPackageItemInput[],
  ): Promise<WeeklyPackageItem[]>;
}
