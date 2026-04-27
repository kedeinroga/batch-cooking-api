import { WeeklyConfig } from '../../domain/entities/weekly-config.entity';
import { DataInputException } from '../../domain/exceptions/batch-cooking.exceptions';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';
import { parseWeekIdentifier } from '../../../shared/week-identifier.utils';

export interface UpsertWeeklyConfigInput {
  weekIdentifier: string;
  startDate: Date;
  maxOrders: number;
  discountPercentage: number;
  isActive: boolean;
  traceId: string;
}

export class UpsertWeeklyConfigUseCase {
  constructor(
    private readonly weeklyConfigRepository: WeeklyConfigRepository,
  ) {}

  async execute(input: UpsertWeeklyConfigInput): Promise<WeeklyConfig> {
    try {
      parseWeekIdentifier(input.weekIdentifier);
    } catch {
      throw new DataInputException(
        `Invalid week identifier: "${input.weekIdentifier}"`,
      );
    }

    if (input.maxOrders < 1)
      throw new DataInputException('maxOrders must be at least 1');
    if (input.discountPercentage < 0 || input.discountPercentage > 100) {
      throw new DataInputException(
        'discountPercentage must be between 0 and 100',
      );
    }

    return this.weeklyConfigRepository.upsert({
      weekIdentifier: input.weekIdentifier,
      startDate: input.startDate,
      maxOrders: input.maxOrders,
      discountPercentage: input.discountPercentage,
      isActive: input.isActive,
    });
  }
}
