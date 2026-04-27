import { UserProfile } from '../../domain/entities/user-profile.entity';
import { DataNotFoundException } from '../../domain/exceptions/batch-cooking.exceptions';
import { UserProfileRepository } from '../../domain-services/repositories/user-profile.repository';

export interface GetProfileInput {
  userId: string;
  traceId: string;
}

export class GetProfileUseCase {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(input: GetProfileInput): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findById(input.userId);
    if (!profile) throw new DataNotFoundException('User profile not found');
    return profile;
  }
}
