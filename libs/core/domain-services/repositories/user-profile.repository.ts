import { UserProfile } from '../../domain/entities/user-profile.entity';

export abstract class UserProfileRepository {
  abstract findById(id: string): Promise<UserProfile | null>;
  abstract upsert(data: UserProfile): Promise<UserProfile>;
}
