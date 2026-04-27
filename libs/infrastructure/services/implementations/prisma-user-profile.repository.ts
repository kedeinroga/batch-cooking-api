import { UserProfile } from '../../../core/domain/entities/user-profile.entity';
import { UserProfileRepository } from '../../../core/domain-services/repositories/user-profile.repository';
import { DataSourceException } from '../../../core/domain/exceptions/batch-cooking.exceptions';
import { PrismaService } from '../custom/prisma.service';
import { UserProfileMapper } from './mappers/user-profile.mapper';

export class PrismaUserProfileRepository extends UserProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<UserProfile | null> {
    try {
      const record = await this.prisma.userProfile.findUnique({
        where: { id },
      });
      return record ? UserProfileMapper.toDomain(record) : null;
    } catch (err) {
      throw new DataSourceException(
        `Failed to find user profile: ${(err as Error).message}`,
      );
    }
  }

  async upsert(data: UserProfile): Promise<UserProfile> {
    try {
      const record = await this.prisma.userProfile.upsert({
        where: { id: data.id },
        update: { role: data.role },
        create: { id: data.id, role: data.role },
      });
      return UserProfileMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to upsert user profile: ${(err as Error).message}`,
      );
    }
  }
}
