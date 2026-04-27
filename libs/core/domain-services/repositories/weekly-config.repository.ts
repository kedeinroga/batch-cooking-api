import { WeeklyConfig } from '../../domain/entities/weekly-config.entity';

export interface UpsertWeeklyConfigInput {
  weekIdentifier: string;
  startDate: Date;
  maxOrders: number;
  discountPercentage: number;
  isActive: boolean;
}

export abstract class WeeklyConfigRepository {
  abstract findByWeekIdentifier(
    weekIdentifier: string,
  ): Promise<WeeklyConfig | null>;
  abstract findActive(): Promise<WeeklyConfig | null>;
  abstract upsert(data: UpsertWeeklyConfigInput): Promise<WeeklyConfig>;
}
