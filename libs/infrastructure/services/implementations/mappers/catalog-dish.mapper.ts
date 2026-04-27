import { CatalogDish as PrismaCatalogDish } from '@prisma/client';
import { CatalogDish } from '../../../../core/domain/entities/catalog-dish.entity';
import { DishType } from '../../../../core/domain/enums/dish-type.enum';

export class CatalogDishMapper {
  static toDomain(record: PrismaCatalogDish): CatalogDish {
    return {
      id: record.id,
      weekIdentifier: record.weekIdentifier,
      name: record.name,
      type: record.type as DishType,
      price: record.price.toNumber(),
    };
  }
}
