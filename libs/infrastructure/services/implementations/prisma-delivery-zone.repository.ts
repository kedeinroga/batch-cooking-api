import { DeliveryZone } from '../../../core/domain/entities/delivery-zone.entity';
import { DeliveryZoneRepository } from '../../../core/domain-services/repositories/delivery-zone.repository';
import { DataSourceException } from '../../../core/domain/exceptions/batch-cooking.exceptions';
import { PrismaService } from '../custom/prisma.service';
import { DeliveryZoneMapper } from './mappers/delivery-zone.mapper';

export class PrismaDeliveryZoneRepository extends DeliveryZoneRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<DeliveryZone[]> {
    try {
      const records = await this.prisma.deliveryZone.findMany({
        orderBy: { districtName: 'asc' },
      });
      return records.map(DeliveryZoneMapper.toDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to list delivery zones: ${(err as Error).message}`,
      );
    }
  }

  async findById(id: string): Promise<DeliveryZone | null> {
    try {
      const record = await this.prisma.deliveryZone.findUnique({
        where: { id },
      });
      return record ? DeliveryZoneMapper.toDomain(record) : null;
    } catch (err) {
      throw new DataSourceException(
        `Failed to find delivery zone: ${(err as Error).message}`,
      );
    }
  }

  async toggleActive(id: string, isActive: boolean): Promise<DeliveryZone> {
    try {
      const record = await this.prisma.deliveryZone.update({
        where: { id },
        data: { isActive },
      });
      return DeliveryZoneMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to toggle delivery zone: ${(err as Error).message}`,
      );
    }
  }
}
