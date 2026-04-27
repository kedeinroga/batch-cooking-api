import { WeeklyConfig as PrismaWeeklyConfig } from '@prisma/client';
import { WeeklyConfig } from '../../../../core/domain/entities/weekly-config.entity';

export class WeeklyConfigMapper {
  static toDomain(record: PrismaWeeklyConfig): WeeklyConfig {
    return {
      id: record.id,
      weekIdentifier: record.weekIdentifier,
      startDate: record.startDate,
      maxOrders: record.maxOrders,
      discountPercentage: record.discountPercentage.toNumber(),
      isActive: record.isActive,
    };
  }
}
