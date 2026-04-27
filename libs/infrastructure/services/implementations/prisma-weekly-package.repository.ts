import { WeeklyPackage } from '../../../core/domain/entities/weekly-package.entity';
import { WeeklyPackageItem } from '../../../core/domain/entities/weekly-package-item.entity';
import {
  WeeklyPackageRepository,
  UpsertWeeklyPackageInput,
  UpsertPackageItemInput,
} from '../../../core/domain-services/repositories/weekly-package.repository';
import { DataSourceException } from '../../../core/domain/exceptions/batch-cooking.exceptions';
import { PrismaService } from '../custom/prisma.service';
import { WeeklyPackageMapper } from './mappers/weekly-package.mapper';

export class PrismaWeeklyPackageRepository extends WeeklyPackageRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<WeeklyPackage | null> {
    try {
      const record = await this.prisma.weeklyPackage.findUnique({
        where: { id },
      });
      return record ? WeeklyPackageMapper.toDomain(record) : null;
    } catch (err) {
      throw new DataSourceException(
        `Failed to find weekly package: ${(err as Error).message}`,
      );
    }
  }

  async findByWeek(weekIdentifier: string): Promise<WeeklyPackage[]> {
    try {
      const records = await this.prisma.weeklyPackage.findMany({
        where: { weekIdentifier },
      });
      return records.map(WeeklyPackageMapper.toDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to list weekly packages: ${(err as Error).message}`,
      );
    }
  }

  async findWithItems(
    id: string,
  ): Promise<(WeeklyPackage & { items: WeeklyPackageItem[] }) | null> {
    try {
      const record = await this.prisma.weeklyPackage.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!record) return null;
      return {
        ...WeeklyPackageMapper.toDomain(record),
        items: record.items.map(WeeklyPackageMapper.itemToDomain),
      };
    } catch (err) {
      throw new DataSourceException(
        `Failed to find weekly package with items: ${(err as Error).message}`,
      );
    }
  }

  async upsert(data: UpsertWeeklyPackageInput): Promise<WeeklyPackage> {
    try {
      if (data.id) {
        const record = await this.prisma.weeklyPackage.update({
          where: { id: data.id },
          data: {
            name: data.name,
            description: data.description,
            discountPercentage: data.discountPercentage,
          },
        });
        return WeeklyPackageMapper.toDomain(record);
      }
      const record = await this.prisma.weeklyPackage.create({
        data: {
          weekIdentifier: data.weekIdentifier,
          name: data.name,
          description: data.description,
          discountPercentage: data.discountPercentage,
        },
      });
      return WeeklyPackageMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to upsert weekly package: ${(err as Error).message}`,
      );
    }
  }

  async upsertItems(
    packageId: string,
    items: UpsertPackageItemInput[],
  ): Promise<WeeklyPackageItem[]> {
    try {
      await this.prisma.weeklyPackageItem.deleteMany({ where: { packageId } });
      const created = await this.prisma.$transaction(
        items.map((item) =>
          this.prisma.weeklyPackageItem.create({
            data: {
              packageId: item.packageId,
              dayOfWeek: item.dayOfWeek,
              mealType: item.mealType,
              dishId: item.dishId,
              sideId: item.sideId,
            },
          }),
        ),
      );
      return created.map(WeeklyPackageMapper.itemToDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to upsert package items: ${(err as Error).message}`,
      );
    }
  }
}
