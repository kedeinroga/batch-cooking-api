import {
  WeeklyPackage as PrismaWeeklyPackage,
  WeeklyPackageItem as PrismaWeeklyPackageItem,
} from '@prisma/client';
import { WeeklyPackage } from '../../../../core/domain/entities/weekly-package.entity';
import { WeeklyPackageItem } from '../../../../core/domain/entities/weekly-package-item.entity';
import { MealType } from '../../../../core/domain/enums/meal-type.enum';

export class WeeklyPackageMapper {
  static toDomain(
    record: PrismaWeeklyPackage & {
      items?: PrismaWeeklyPackageItem[];
    },
  ): WeeklyPackage {
    return {
      id: record.id,
      weekIdentifier: record.weekIdentifier,
      name: record.name,
      description: record.description ?? undefined,
      discountPercentage: record.discountPercentage.toNumber(),
      ...(record.items && {
        items: record.items.map(WeeklyPackageMapper.itemToDomain),
      }),
    };
  }

  static itemToDomain(record: PrismaWeeklyPackageItem): WeeklyPackageItem {
    return {
      id: record.id,
      packageId: record.packageId,
      dayOfWeek: record.dayOfWeek,
      mealType: record.mealType as MealType,
      dishId: record.dishId,
      sideId: record.sideId ?? undefined,
    };
  }
}
