import { Module } from '@nestjs/common';
import {
  ConfigModule,
  PrismaModule,
  PrismaService,
  GcpStorageModule,
  GcpStorageService,
  PrismaOrderRepository,
  PrismaUserProfileRepository,
  GcpVoucherStorageService,
} from '@batch-cooking/infrastructure';
import {
  OrderRepository,
  StorageService,
  UserProfileRepository,
} from '@batch-cooking/domain-services';
import {
  GenerateVoucherUploadUrlUseCase,
  ConfirmVoucherUploadUseCase,
  ConfirmPaymentUseCase,
} from '@batch-cooking/use-cases';
import { Reflector } from '@nestjs/core';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentsController } from './payments.controller';

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
      provide: GenerateVoucherUploadUrlUseCase,
      useFactory: (o: OrderRepository, s: StorageService) =>
        new GenerateVoucherUploadUrlUseCase(o, s),
      inject: [OrderRepository, StorageService],
    },
    {
      provide: ConfirmVoucherUploadUseCase,
      useFactory: (o: OrderRepository) => new ConfirmVoucherUploadUseCase(o),
      inject: [OrderRepository],
    },
    {
      provide: ConfirmPaymentUseCase,
      useFactory: (o: OrderRepository) => new ConfirmPaymentUseCase(o),
      inject: [OrderRepository],
    },
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
