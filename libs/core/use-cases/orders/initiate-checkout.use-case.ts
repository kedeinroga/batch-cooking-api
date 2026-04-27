import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import {
  DataNotFoundException,
  DataInputException,
  OrderNotEditableException,
  OrderWindowClosedException,
  OrderCapacityExceededException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';
import { WeeklyPackageRepository } from '../../domain-services/repositories/weekly-package.repository';
import { isOrderWindowOpen } from '../../../shared/week-identifier.utils';
import {
  calculateDiscount,
  resolveDiscountPercentage,
} from '../../../shared/discount.utils';
import { generateTicketNumber } from '../../../shared/ticket-number.utils';

export interface InitiateCheckoutInput {
  userId: string;
  orderId: string;
  traceId: string;
}

export class InitiateCheckoutUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly weeklyConfigRepository: WeeklyConfigRepository,
    private readonly weeklyPackageRepository: WeeklyPackageRepository,
  ) {}

  async execute(input: InitiateCheckoutInput): Promise<Order> {
    // 1. Validate order window
    if (!isOrderWindowOpen()) {
      throw new OrderWindowClosedException(
        'The order window is currently closed',
      );
    }

    // 2. Validate order exists and belongs to the user
    const order = await this.orderRepository.findByIdWithItems(input.orderId);
    if (!order) throw new DataNotFoundException('Order not found');
    if (order.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Order does not belong to this user',
      );
    if (order.status !== OrderStatus.DRAFT)
      throw new OrderNotEditableException('Order is not in DRAFT status');
    if (!order.items || order.items.length === 0) {
      throw new DataInputException(
        'Order has no items — add at least one dish before checkout',
      );
    }

    // 3. Load weekly config
    const config = await this.weeklyConfigRepository.findByWeekIdentifier(
      order.weekIdentifier,
    );
    if (!config || !config.isActive) {
      throw new DataInputException(
        `No active weekly config for week "${order.weekIdentifier}"`,
      );
    }

    // 4–9. Atomic transaction: capacity check + pricing + status update
    return this.orderRepository.updateWithTransaction(
      input.orderId,
      {},
      async (tx: unknown) => {
        // 4. Count confirmed orders (SELECT ... FOR UPDATE equivalent via Prisma transaction)
        const confirmedCount = await this.orderRepository.countConfirmedByWeek(
          order.weekIdentifier,
          tx,
        );

        // 5. Capacity check
        if (confirmedCount >= config.maxOrders) {
          throw new OrderCapacityExceededException(
            'Weekly capacity has been reached',
          );
        }

        // 6. Calculate subtotal from items
        const subtotal = order.items!.reduce((sum, item) => {
          // prices come loaded via findByIdWithItems joining catalog_dishes
          const dishPrice = (item as any).dishPrice ?? 0;
          const sidePrice = (item as any).sidePrice ?? 0;
          return sum + dishPrice + sidePrice;
        }, 0);

        // 7. Determine discount
        let packageDiscountPct = 0;
        if (order.sourcePackageId) {
          const pkg = await this.weeklyPackageRepository.findById(
            order.sourcePackageId,
          );
          packageDiscountPct = pkg?.discountPercentage ?? 0;
        }

        const discountPct = resolveDiscountPercentage(
          order.sourcePackageId,
          packageDiscountPct,
          config.discountPercentage,
        );
        const { discountAmount, total } = calculateDiscount(
          subtotal,
          discountPct,
        );

        // 8. Generate ticket number
        const sequential = await this.orderRepository.nextTicketSequential(
          order.weekIdentifier,
          tx,
        );
        const ticketNumber = generateTicketNumber(
          order.weekIdentifier,
          sequential,
        );

        // 9. Update order
        return this.orderRepository.updateWithTransaction(
          input.orderId,
          {
            status: OrderStatus.PENDING_PAYMENT,
            subtotal,
            discountApplied: discountAmount,
            total,
            ticketNumber,
          },
          tx,
        );
      },
    );
  }
}
