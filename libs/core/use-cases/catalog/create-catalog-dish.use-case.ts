import { CatalogDish } from '../../domain/entities/catalog-dish.entity';
import { DishType } from '../../domain/enums/dish-type.enum';
import { DataNotFoundException } from '../../domain/exceptions/batch-cooking.exceptions';
import { CatalogDishRepository } from '../../domain-services/repositories/catalog-dish.repository';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';

export interface CreateCatalogDishInput {
  weekIdentifier: string;
  name: string;
  type: DishType;
  price: number;
  traceId: string;
}

export class CreateCatalogDishUseCase {
  constructor(
    private readonly catalogDishRepository: CatalogDishRepository,
    private readonly weeklyConfigRepository: WeeklyConfigRepository,
  ) {}

  async execute(input: CreateCatalogDishInput): Promise<CatalogDish> {
    const config = await this.weeklyConfigRepository.findByWeekIdentifier(
      input.weekIdentifier,
    );
    if (!config)
      throw new DataNotFoundException(
        `No weekly config found for week "${input.weekIdentifier}"`,
      );

    return this.catalogDishRepository.create({
      weekIdentifier: input.weekIdentifier,
      name: input.name,
      type: input.type,
      price: input.price,
    });
  }
}
