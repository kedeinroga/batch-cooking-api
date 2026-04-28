import { OrderStatus } from '../../domain/enums/order-status.enum';
import { DishType } from '../../domain/enums/dish-type.enum';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { CatalogDishRepository } from '../../domain-services/repositories/catalog-dish.repository';

export interface GenerateProductionReportInput {
  weekIdentifier: string;
  traceId: string;
}

export interface ProductionReportItem {
  dishId: string;
  dishName: string;
  dishType: DishType;
  quantity: number;
}

export interface GenerateProductionReportOutput {
  weekIdentifier: string;
  items: ProductionReportItem[];
}

export class GenerateProductionReportUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogDishRepository: CatalogDishRepository,
  ) {}

  async execute(
    input: GenerateProductionReportInput,
  ): Promise<GenerateProductionReportOutput> {
    const orders = await this.orderRepository.findByWeekAndStatus(
      input.weekIdentifier,
      [OrderStatus.CONFIRMED, OrderStatus.DELIVERED],
    );

    const counts = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items ?? []) {
        counts.set(item.dishId, (counts.get(item.dishId) ?? 0) + 1);
        if (item.sideId) {
          counts.set(item.sideId, (counts.get(item.sideId) ?? 0) + 1);
        }
      }
    }

    if (counts.size === 0) {
      return { weekIdentifier: input.weekIdentifier, items: [] };
    }

    const dishes = await this.catalogDishRepository.findByIds([
      ...counts.keys(),
    ]);

    const items: ProductionReportItem[] = dishes.map((dish) => ({
      dishId: dish.id,
      dishName: dish.name,
      dishType: dish.type,
      quantity: counts.get(dish.id) ?? 0,
    }));

    return { weekIdentifier: input.weekIdentifier, items };
  }
}
