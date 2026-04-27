import { UserProfile as PrismaUserProfile } from '@prisma/client';
import { UserProfile } from '../../../../core/domain/entities/user-profile.entity';
import { UserRole } from '../../../../core/domain/enums/user-role.enum';

export class UserProfileMapper {
  static toDomain(record: PrismaUserProfile): UserProfile {
    return {
      id: record.id,
      role: record.role as UserRole,
    };
  }
}
