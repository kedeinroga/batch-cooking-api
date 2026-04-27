import { WeeklyConfig } from '../../../core/domain/entities/weekly-config.entity';
import {
  WeeklyConfigRepository,
  UpsertWeeklyConfigInput,
} from '../../../core/domain-services/repositories/weekly-config.repository';
import { DataSourceException } from '../../../core/domain/exceptions/batch-cooking.exceptions';
import { PrismaService } from '../custom/prisma.service';
import { WeeklyConfigMapper } from './mappers/weekly-config.mapper';

export class PrismaWeeklyConfigRepository extends WeeklyConfigRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByWeekIdentifier(
    weekIdentifier: string,
  ): Promise<WeeklyConfig | null> {
    try {
      const record = await this.prisma.weeklyConfig.findUnique({
        where: { weekIdentifier },
      });
      return record ? WeeklyConfigMapper.toDomain(record) : null;
    } catch (err) {
      throw new DataSourceException(
        `Failed to find weekly config: ${(err as Error).message}`,
      );
    }
  }

  async findActive(): Promise<WeeklyConfig | null> {
    try {
      const record = await this.prisma.weeklyConfig.findFirst({
        where: { isActive: true },
      });
      return record ? WeeklyConfigMapper.toDomain(record) : null;
    } catch (err) {
      throw new DataSourceException(
        `Failed to find active weekly config: ${(err as Error).message}`,
      );
    }
  }

  async upsert(data: UpsertWeeklyConfigInput): Promise<WeeklyConfig> {
    try {
      const record = await this.prisma.weeklyConfig.upsert({
        where: { weekIdentifier: data.weekIdentifier },
        update: {
          startDate: data.startDate,
          maxOrders: data.maxOrders,
          discountPercentage: data.discountPercentage,
          isActive: data.isActive,
        },
        create: {
          weekIdentifier: data.weekIdentifier,
          startDate: data.startDate,
          maxOrders: data.maxOrders,
          discountPercentage: data.discountPercentage,
          isActive: data.isActive,
        },
      });
      return WeeklyConfigMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to upsert weekly config: ${(err as Error).message}`,
      );
    }
  }
}
