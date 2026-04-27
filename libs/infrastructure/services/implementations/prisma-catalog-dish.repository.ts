import { CatalogDish } from '../../../core/domain/entities/catalog-dish.entity';
import {
  CatalogDishRepository,
  CreateCatalogDishInput,
} from '../../../core/domain-services/repositories/catalog-dish.repository';
import { DataSourceException } from '../../../core/domain/exceptions/batch-cooking.exceptions';
import { PrismaService } from '../custom/prisma.service';
import { CatalogDishMapper } from './mappers/catalog-dish.mapper';

export class PrismaCatalogDishRepository extends CatalogDishRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<CatalogDish | null> {
    try {
      const record = await this.prisma.catalogDish.findUnique({
        where: { id },
      });
      return record ? CatalogDishMapper.toDomain(record) : null;
    } catch (err) {
      throw new DataSourceException(
        `Failed to find catalog dish: ${(err as Error).message}`,
      );
    }
  }

  async findByWeek(weekIdentifier: string): Promise<CatalogDish[]> {
    try {
      const records = await this.prisma.catalogDish.findMany({
        where: { weekIdentifier },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      });
      return records.map(CatalogDishMapper.toDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to list catalog dishes: ${(err as Error).message}`,
      );
    }
  }

  async findByIds(ids: string[]): Promise<CatalogDish[]> {
    try {
      const records = await this.prisma.catalogDish.findMany({
        where: { id: { in: ids } },
      });
      return records.map(CatalogDishMapper.toDomain);
    } catch (err) {
      throw new DataSourceException(
        `Failed to find catalog dishes by ids: ${(err as Error).message}`,
      );
    }
  }

  async create(data: CreateCatalogDishInput): Promise<CatalogDish> {
    try {
      const record = await this.prisma.catalogDish.create({ data });
      return CatalogDishMapper.toDomain(record);
    } catch (err) {
      throw new DataSourceException(
        `Failed to create catalog dish: ${(err as Error).message}`,
      );
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.catalogDish.delete({ where: { id } });
    } catch (err) {
      throw new DataSourceException(
        `Failed to delete catalog dish: ${(err as Error).message}`,
      );
    }
  }
}
