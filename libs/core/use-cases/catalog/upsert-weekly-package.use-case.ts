import { WeeklyPackage } from '../../domain/entities/weekly-package.entity';
import { WeeklyPackageItem } from '../../domain/entities/weekly-package-item.entity';
import { MealType } from '../../domain/enums/meal-type.enum';
import { DataNotFoundException } from '../../domain/exceptions/batch-cooking.exceptions';
import { WeeklyPackageRepository } from '../../domain-services/repositories/weekly-package.repository';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';

export interface PackageItemInput {
  dayOfWeek: number;
  mealType: MealType;
  dishId: string;
  sideId?: string;
}

export interface UpsertWeeklyPackageInput {
  id?: string;
  weekIdentifier: string;
  name: string;
  description?: string;
  discountPercentage: number;
  items: PackageItemInput[];
  traceId: string;
}

export interface UpsertWeeklyPackageOutput {
  package: WeeklyPackage;
  items: WeeklyPackageItem[];
}

export class UpsertWeeklyPackageUseCase {
  constructor(
    private readonly weeklyPackageRepository: WeeklyPackageRepository,
    private readonly weeklyConfigRepository: WeeklyConfigRepository,
  ) {}

  async execute(
    input: UpsertWeeklyPackageInput,
  ): Promise<UpsertWeeklyPackageOutput> {
    const config = await this.weeklyConfigRepository.findByWeekIdentifier(
      input.weekIdentifier,
    );
    if (!config)
      throw new DataNotFoundException(
        `No weekly config found for week "${input.weekIdentifier}"`,
      );

    const pkg = await this.weeklyPackageRepository.upsert({
      id: input.id,
      weekIdentifier: input.weekIdentifier,
      name: input.name,
      description: input.description,
      discountPercentage: input.discountPercentage,
    });

    const items = await this.weeklyPackageRepository.upsertItems(
      pkg.id,
      input.items.map((item) => ({
        packageId: pkg.id,
        dayOfWeek: item.dayOfWeek,
        mealType: item.mealType,
        dishId: item.dishId,
        sideId: item.sideId,
      })),
    );

    return { package: pkg, items };
  }
}
