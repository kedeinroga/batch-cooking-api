import { DeliveryZone as PrismaDeliveryZone } from '@prisma/client';
import { DeliveryZone } from '../../../../core/domain/entities/delivery-zone.entity';

export class DeliveryZoneMapper {
  static toDomain(record: PrismaDeliveryZone): DeliveryZone {
    return {
      id: record.id,
      districtName: record.districtName,
      isActive: record.isActive,
    };
  }
}
