import { Order } from '../../domain/entities/order.entity';
import { OrderStatus } from '../../domain/enums/order-status.enum';

export interface CreateOrderInput {
  userId: string;
  weekIdentifier: string;
  deliveryAddressId: string;
}

export interface DeliveryListItem {
  orderId: string;
  ticketNumber: string;
  customerEmail: string;
  addressLine: string;
  district: string;
  reference?: string;
  status: OrderStatus;
  total: number;
}

export abstract class OrderRepository {
  abstract create(data: CreateOrderInput): Promise<Order>;
  abstract findById(id: string): Promise<Order | null>;
  abstract findByIdWithItems(id: string): Promise<Order | null>;
  abstract findByUserAndWeek(
    userId: string,
    weekIdentifier: string,
  ): Promise<Order[]>;
  abstract findByWeekAndStatus(
    weekIdentifier: string,
    statuses: OrderStatus[],
  ): Promise<Order[]>;
  abstract findDeliveryItemsByWeek(
    weekIdentifier: string,
    statuses: OrderStatus[],
  ): Promise<DeliveryListItem[]>;
  abstract updateStatus(
    id: string,
    status: OrderStatus,
    extra?: Partial<Order>,
  ): Promise<Order>;
  abstract countConfirmedByWeek(
    weekIdentifier: string,
    tx?: unknown,
  ): Promise<number>;
  abstract updateWithTransaction(
    id: string,
    data: Partial<Order>,
    tx: unknown,
  ): Promise<Order>;
  abstract deleteById(id: string): Promise<void>;
  abstract nextTicketSequential(
    weekIdentifier: string,
    tx: unknown,
  ): Promise<number>;
  abstract findOrdersWithDeliveredVouchers(
    olderThanDays: number,
  ): Promise<Order[]>;
}
