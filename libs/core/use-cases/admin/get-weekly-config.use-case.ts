import { WeeklyConfig } from '../../domain/entities/weekly-config.entity';
import { DataNotFoundException } from '../../domain/exceptions/batch-cooking.exceptions';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';

export interface GetWeeklyConfigInput {
  weekIdentifier: string;
  traceId: string;
}

export class GetWeeklyConfigUseCase {
  constructor(
    private readonly weeklyConfigRepository: WeeklyConfigRepository,
  ) {}

  async execute(input: GetWeeklyConfigInput): Promise<WeeklyConfig> {
    const config = await this.weeklyConfigRepository.findByWeekIdentifier(
      input.weekIdentifier,
    );
    if (!config) {
      throw new DataNotFoundException(
        `No config found for week ${input.weekIdentifier}`,
      );
    }
    return config;
  }
}
