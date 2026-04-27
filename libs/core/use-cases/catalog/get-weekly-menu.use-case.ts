import { CatalogDish } from '../../domain/entities/catalog-dish.entity';
import { WeeklyPackage } from '../../domain/entities/weekly-package.entity';
import { DataNotFoundException } from '../../domain/exceptions/batch-cooking.exceptions';
import { CatalogDishRepository } from '../../domain-services/repositories/catalog-dish.repository';
import { WeeklyPackageRepository } from '../../domain-services/repositories/weekly-package.repository';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';

export interface GetWeeklyMenuInput {
  weekIdentifier: string;
  traceId: string;
}

export interface GetWeeklyMenuOutput {
  weekIdentifier: string;
  dishes: CatalogDish[];
  packages: WeeklyPackage[];
}

export class GetWeeklyMenuUseCase {
  constructor(
    private readonly catalogDishRepository: CatalogDishRepository,
    private readonly weeklyPackageRepository: WeeklyPackageRepository,
    private readonly weeklyConfigRepository: WeeklyConfigRepository,
  ) {}

  async execute(input: GetWeeklyMenuInput): Promise<GetWeeklyMenuOutput> {
    const config = await this.weeklyConfigRepository.findByWeekIdentifier(
      input.weekIdentifier,
    );
    if (!config || !config.isActive) {
      throw new DataNotFoundException(
        `No active menu found for week "${input.weekIdentifier}"`,
      );
    }

    const [dishes, packages] = await Promise.all([
      this.catalogDishRepository.findByWeek(input.weekIdentifier),
      this.weeklyPackageRepository.findByWeek(input.weekIdentifier),
    ]);

    return { weekIdentifier: input.weekIdentifier, dishes, packages };
  }
}
