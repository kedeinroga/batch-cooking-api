import { Module } from '@nestjs/common';
import {
  ConfigModule,
  PrismaModule,
  PrismaService,
  GcpStorageModule,
  GcpStorageService,
  PrismaOrderRepository,
  PrismaUserProfileRepository,
  PrismaCatalogDishRepository,
  GcpVoucherStorageService,
} from '@batch-cooking/infrastructure';
import {
  OrderRepository,
  StorageService,
  UserProfileRepository,
  CatalogDishRepository,
} from '@batch-cooking/domain-services';
import {
  MarkOrderAsDeliveredUseCase,
  GetVoucherSignedUrlUseCase,
  GenerateProductionReportUseCase,
  GetDeliveryListUseCase,
  ListPendingPaymentOrdersUseCase,
} from '@batch-cooking/use-cases';
import { Reflector } from '@nestjs/core';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { OperationsController } from './operations.controller';

@Module({
  imports: [ConfigModule, PrismaModule, GcpStorageModule],
  providers: [
    Reflector,
    SupabaseJwtGuard,
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
      provide: CatalogDishRepository,
      useFactory: (p: PrismaService) => new PrismaCatalogDishRepository(p),
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
      provide: MarkOrderAsDeliveredUseCase,
      useFactory: (o: OrderRepository) => new MarkOrderAsDeliveredUseCase(o),
      inject: [OrderRepository],
    },
    {
      provide: GetVoucherSignedUrlUseCase,
      useFactory: (o: OrderRepository, s: StorageService) =>
        new GetVoucherSignedUrlUseCase(o, s),
      inject: [OrderRepository, StorageService],
    },
    {
      provide: GenerateProductionReportUseCase,
      useFactory: (o: OrderRepository, c: CatalogDishRepository) =>
        new GenerateProductionReportUseCase(o, c),
      inject: [OrderRepository, CatalogDishRepository],
    },
    {
      provide: GetDeliveryListUseCase,
      useFactory: (o: OrderRepository) => new GetDeliveryListUseCase(o),
      inject: [OrderRepository],
    },
    {
      provide: ListPendingPaymentOrdersUseCase,
      useFactory: (o: OrderRepository) =>
        new ListPendingPaymentOrdersUseCase(o),
      inject: [OrderRepository],
    },
  ],
  controllers: [OperationsController],
})
export class OperationsModule {}
