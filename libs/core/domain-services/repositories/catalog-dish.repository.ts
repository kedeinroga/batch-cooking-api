import { CatalogDish } from '../../domain/entities/catalog-dish.entity';
import { DishType } from '../../domain/enums/dish-type.enum';

export interface CreateCatalogDishInput {
  weekIdentifier: string;
  name: string;
  type: DishType;
  price: number;
}

export interface UpdateCatalogDishInput {
  name: string;
  type: DishType;
  price: number;
}

export abstract class CatalogDishRepository {
  abstract findById(id: string): Promise<CatalogDish | null>;
  abstract findByWeek(weekIdentifier: string): Promise<CatalogDish[]>;
  abstract findByIds(ids: string[]): Promise<CatalogDish[]>;
  abstract create(data: CreateCatalogDishInput): Promise<CatalogDish>;
  abstract update(id: string, data: UpdateCatalogDishInput): Promise<CatalogDish>;
  abstract deleteById(id: string): Promise<void>;
}
