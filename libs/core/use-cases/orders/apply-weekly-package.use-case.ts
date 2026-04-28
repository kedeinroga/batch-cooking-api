import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  DataNotFoundException,
  DataInputException,
  OrderNotEditableException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { WeeklyPackageRepository } from '../../domain-services/repositories/weekly-package.repository';
import {
  OrderItemRepository,
  UpsertOrderItemInput,
} from '../../domain-services/repositories/order-item.repository';
import { computeSubtotal, calculateDiscount } from '../../../shared/discount.utils';

export interface ApplyWeeklyPackageInput {
  userId: string;
  orderId: string;
  packageId: string;
  traceId: string;
}

export class ApplyWeeklyPackageUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly weeklyPackageRepository: WeeklyPackageRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async execute(input: ApplyWeeklyPackageInput): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Order does not belong to this user',
      );
    if (order.status !== OrderStatus.DRAFT)
      throw new OrderNotEditableException('Order is not in DRAFT status');

    const pkg = await this.weeklyPackageRepository.findWithItems(
      input.packageId,
    );
    if (!pkg) throw new DataNotFoundException('Weekly package not found');
    if (pkg.weekIdentifier !== order.weekIdentifier) {
      throw new DataInputException(
        'Package does not belong to the same week as the order',
      );
    }

    const items: UpsertOrderItemInput[] = pkg.items.map((item) => ({
      orderId: input.orderId,
      dayOfWeek: item.dayOfWeek,
      mealType: item.mealType,
      dishId: item.dishId,
      sideId: item.sideId,
    }));

    await this.orderItemRepository.replaceAll(input.orderId, items);

    // Recalculate totals with the package discount
    const orderWithItems = await this.orderRepository.findByIdWithItems(
      input.orderId,
    );
    const subtotal = computeSubtotal(
      (orderWithItems?.items ?? []).map((i) => ({
        dishPrice: (i as any).dishPrice ?? 0,
        sidePrice: (i as any).sidePrice ?? 0,
      })),
    );
    const { discountAmount, total } = calculateDiscount(
      subtotal,
      pkg.discountPercentage,
    );

    return this.orderRepository.updateStatus(input.orderId, OrderStatus.DRAFT, {
      sourcePackageId: input.packageId,
      subtotal,
      discountApplied: discountAmount,
      total,
    });
  }
}
