import { Module } from '@nestjs/common';
import {
  ConfigModule,
  PrismaModule,
  PrismaService,
  PrismaCatalogDishRepository,
  PrismaWeeklyPackageRepository,
  PrismaWeeklyConfigRepository,
  PrismaUserProfileRepository,
} from '@batch-cooking/infrastructure';
import {
  CatalogDishRepository,
  WeeklyPackageRepository,
  WeeklyConfigRepository,
  UserProfileRepository,
} from '@batch-cooking/domain-services';
import {
  CreateCatalogDishUseCase,
  GetWeeklyMenuUseCase,
  UpsertWeeklyPackageUseCase,
  DeleteCatalogDishUseCase,
} from '@batch-cooking/use-cases';
import { Reflector } from '@nestjs/core';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    Reflector,
    SupabaseJwtGuard,
    {
      provide: CatalogDishRepository,
      useFactory: (p: PrismaService) => new PrismaCatalogDishRepository(p),
      inject: [PrismaService],
    },
    {
      provide: WeeklyPackageRepository,
      useFactory: (p: PrismaService) => new PrismaWeeklyPackageRepository(p),
      inject: [PrismaService],
    },
    {
      provide: WeeklyConfigRepository,
      useFactory: (p: PrismaService) => new PrismaWeeklyConfigRepository(p),
      inject: [PrismaService],
    },
    {
      provide: UserProfileRepository,
      useFactory: (p: PrismaService) => new PrismaUserProfileRepository(p),
      inject: [PrismaService],
    },
    {
      provide: RolesGuard,
      useFactory: (r: Reflector, u: UserProfileRepository) =>
        new RolesGuard(r, u),
      inject: [Reflector, UserProfileRepository],
    },
    {
      provide: CreateCatalogDishUseCase,
      useFactory: (c: CatalogDishRepository, w: WeeklyConfigRepository) =>
        new CreateCatalogDishUseCase(c, w),
      inject: [CatalogDishRepository, WeeklyConfigRepository],
    },
    {
      provide: GetWeeklyMenuUseCase,
      useFactory: (
        c: CatalogDishRepository,
        p: WeeklyPackageRepository,
        w: WeeklyConfigRepository,
      ) => new GetWeeklyMenuUseCase(c, p, w),
      inject: [
        CatalogDishRepository,
        WeeklyPackageRepository,
        WeeklyConfigRepository,
      ],
    },
    {
      provide: UpsertWeeklyPackageUseCase,
      useFactory: (p: WeeklyPackageRepository, w: WeeklyConfigRepository) =>
        new UpsertWeeklyPackageUseCase(p, w),
      inject: [WeeklyPackageRepository, WeeklyConfigRepository],
    },
    {
      provide: DeleteCatalogDishUseCase,
      useFactory: (c: CatalogDishRepository) => new DeleteCatalogDishUseCase(c),
      inject: [CatalogDishRepository],
    },
  ],
  controllers: [CatalogController],
})
export class CatalogModule {}
