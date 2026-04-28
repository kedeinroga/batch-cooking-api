import { CatalogDish } from '../../domain/entities/catalog-dish.entity';
import { DishType } from '../../domain/enums/dish-type.enum';
import { DataNotFoundException } from '../../domain/exceptions/batch-cooking.exceptions';
import { CatalogDishRepository } from '../../domain-services/repositories/catalog-dish.repository';

export interface UpdateCatalogDishInput {
  dishId: string;
  name: string;
  type: DishType;
  price: number;
  traceId: string;
}

export class UpdateCatalogDishUseCase {
  constructor(private readonly catalogDishRepository: CatalogDishRepository) {}

  async execute(input: UpdateCatalogDishInput): Promise<CatalogDish> {
    const dish = await this.catalogDishRepository.findById(input.dishId);
    if (!dish) throw new DataNotFoundException('Catalog dish not found');

    return this.catalogDishRepository.update(input.dishId, {
      name: input.name,
      type: input.type,
      price: input.price,
    });
  }
}
