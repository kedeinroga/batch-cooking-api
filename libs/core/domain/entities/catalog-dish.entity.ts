import { DishType } from '../enums/dish-type.enum';

export class CatalogDish {
  id: string;
  weekIdentifier: string;
  name: string;
  type: DishType;
  price: number;
}
