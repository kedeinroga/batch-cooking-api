import { DeliveryAddress } from '../../../core/domain/entities/delivery-address.entity';
import {
  DeliveryAddressRepository,
  CreateDeliveryAddressInput,
  UpdateDeliveryAddressInput,
} from '../../../core/domain-services/repositories/delivery-address.repository';
import { DataSourceException } from '../../../core/domain/exceptions/batch-cooking.exceptions';
import { PrismaService } from '../custom/prisma.service';
import { DeliveryAddressMapper } from './mappers/delivery-address.mapper';

export class PrismaDeliveryAddressRepository extends DeliveryAddressRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<DeliveryAddress | null> {
    try {
      const record = await this.prisma.deliveryAddress.findUnique({
        where: { id },
      });
      return record ? DeliveryAddressMapper.toDomain(record) : null;
    } catch (err) {
      throw new DataSourceException(
        `Failed to find delivery address: ${(err as Error).message}`,
      );
    }
  }

  async findByUser(userId: string): Promise<DeliveryAddress[]> {
    try {
      const records = await this.prisma.deliveryAddress.findMany({
        where: { userId },
      });
      return records.map(DeliveryAddressMapper.toDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to list delivery addresses: ${(err as Error).message}`,
      );
    }
  }

  async create(data: CreateDeliveryAddressInput): Promise<DeliveryAddress> {
    try {
      const record = await this.prisma.deliveryAddress.create({ data });
      return DeliveryAddressMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to create delivery address: ${(err as Error).message}`,
      );
    }
  }

  async update(
    id: string,
    data: UpdateDeliveryAddressInput,
  ): Promise<DeliveryAddress> {
    try {
      const record = await this.prisma.deliveryAddress.update({
        where: { id },
        data: {
          label: data.label,
          addressLine: data.addressLine,
          districtId: data.districtId,
          reference: data.reference ?? null,
        },
      });
      return DeliveryAddressMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to update delivery address: ${(err as Error).message}`,
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.deliveryAddress.delete({ where: { id } });
    } catch (err) {
      throw new DataSourceException(
        `Failed to delete delivery address: ${(err as Error).message}`,
      );
    }
  }
}
