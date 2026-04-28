import { OrderStatus } from '../enums/order-status.enum';
import { OrderItem } from './order-item.entity';

export class Order {
  id: string;
  userId: string;
  weekIdentifier: string;
  deliveryAddressId: string;
  sourcePackageId?: string;
  appliedPackageId?: string;
  subtotal: number;
  discountApplied: number;
  total: number;
  status: OrderStatus;
  ticketNumber?: string;
  voucherPath?: string;
  deliveredAt?: Date;
  items?: OrderItem[];
}
