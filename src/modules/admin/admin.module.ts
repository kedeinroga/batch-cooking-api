import { Module } from '@nestjs/common';
import {
  ConfigModule,
  PrismaModule,
  PrismaService,
  GcpStorageModule,
  GcpStorageService,
  PrismaWeeklyConfigRepository,
  PrismaDeliveryZoneRepository,
  PrismaOrderRepository,
  PrismaUserProfileRepository,
  GcpVoucherStorageService,
} from '@batch-cooking/infrastructure';
import {
  WeeklyConfigRepository,
  DeliveryZoneRepository,
  OrderRepository,
  StorageService,
  UserProfileRepository,
} from '@batch-cooking/domain-services';
import {
  UpsertWeeklyConfigUseCase,
  ToggleDeliveryZoneUseCase,
  CleanupExpiredVouchersUseCase,
} from '@batch-cooking/use-cases';
import { Reflector } from '@nestjs/core';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AdminController } from './admin.controller';

@Module({
  imports: [ConfigModule, PrismaModule, GcpStorageModule],
  providers: [
    Reflector,
    SupabaseJwtGuard,
    {
      provide: WeeklyConfigRepository,
      useFactory: (p: PrismaService) => new PrismaWeeklyConfigRepository(p),
      inject: [PrismaService],
    },
    {
      provide: DeliveryZoneRepository,
      useFactory: (p: PrismaService) => new PrismaDeliveryZoneRepository(p),
      inject: [PrismaService],
    },
    {
      provide: OrderRepository,
      useFactory: (p: PrismaService) => new PrismaOrderRepository(p),
      inject: [PrismaService],
    },
    {
      provide: UserProfileRepository,
      useFactory: (p: PrismaService) => new PrismaUserProfileRepository(p),
      inject: [PrismaService],
    },
    {
      provide: StorageService,
      useFactory: (g: GcpStorageService) => new GcpVoucherStorageService(g),
      inject: [GcpStorageService],
    },
    {
      provide: RolesGuard,
      useFactory: (r: Reflector, u: UserProfileRepository) =>
        new RolesGuard(r, u),
      inject: [Reflector, UserProfileRepository],
    },
    {
      provide: UpsertWeeklyConfigUseCase,
      useFactory: (w: WeeklyConfigRepository) =>
        new UpsertWeeklyConfigUseCase(w),
      inject: [WeeklyConfigRepository],
    },
    {
      provide: ToggleDeliveryZoneUseCase,
      useFactory: (d: DeliveryZoneRepository) =>
        new ToggleDeliveryZoneUseCase(d),
      inject: [DeliveryZoneRepository],
    },
    {
      provide: CleanupExpiredVouchersUseCase,
      useFactory: (o: OrderRepository, s: StorageService) =>
        new CleanupExpiredVouchersUseCase(o, s),
      inject: [OrderRepository, StorageService],
    },
  ],
  controllers: [AdminController],
})
export class AdminModule {}
