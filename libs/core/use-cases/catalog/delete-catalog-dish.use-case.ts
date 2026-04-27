import { DataNotFoundException } from '../../domain/exceptions/batch-cooking.exceptions';
import { CatalogDishRepository } from '../../domain-services/repositories/catalog-dish.repository';

export interface DeleteCatalogDishInput {
  dishId: string;
  traceId: string;
}

export class DeleteCatalogDishUseCase {
  constructor(private readonly catalogDishRepository: CatalogDishRepository) {}

  async execute(input: DeleteCatalogDishInput): Promise<void> {
    const dish = await this.catalogDishRepository.findById(input.dishId);
    if (!dish) throw new DataNotFoundException('Catalog dish not found');
    await this.catalogDishRepository.deleteById(input.dishId);
  }
}
