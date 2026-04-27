import { DeliveryAddress as PrismaDeliveryAddress } from '@prisma/client';
import { DeliveryAddress } from '../../../../core/domain/entities/delivery-address.entity';

export class DeliveryAddressMapper {
  static toDomain(record: PrismaDeliveryAddress): DeliveryAddress {
    return {
      id: record.id,
      userId: record.userId,
      label: record.label,
      addressLine: record.addressLine,
      districtId: record.districtId,
      reference: record.reference ?? undefined,
    };
  }
}
