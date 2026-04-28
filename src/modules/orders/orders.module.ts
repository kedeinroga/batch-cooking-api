import { Module } from '@nestjs/common';
import {
  ConfigModule,
  PrismaModule,
  PrismaService,
} from '@batch-cooking/infrastructure';
import {
  PrismaOrderRepository,
  PrismaOrderItemRepository,
  PrismaWeeklyConfigRepository,
  PrismaWeeklyPackageRepository,
  PrismaUserProfileRepository,
} from '@batch-cooking/infrastructure';
import {
  OrderRepository,
  OrderItemRepository,
  WeeklyConfigRepository,
  WeeklyPackageRepository,
  UserProfileRepository,
} from '@batch-cooking/domain-services';
import {
  CreateOrderUseCase,
  UpsertDailySelectionUseCase,
  RemoveOrderItemUseCase,
  ApplyWeeklyPackageUseCase,
  InitiateCheckoutUseCase,
  CancelOrderUseCase,
  DeleteDraftOrderUseCase,
  ListUserOrdersUseCase,
  GetOrderDetailUseCase,
} from '@batch-cooking/use-cases';
import { Reflector } from '@nestjs/core';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { OrdersController } from './orders.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    Reflector,
    SupabaseJwtGuard,
    // Repositories
    {
      provide: OrderRepository,
      useFactory: (p: PrismaService) => new PrismaOrderRepository(p),
      inject: [PrismaService],
    },
    {
      provide: OrderItemRepository,
      useFactory: (p: PrismaService) => new PrismaOrderItemRepository(p),
      inject: [PrismaService],
    },
    {
      provide: WeeklyConfigRepository,
      useFactory: (p: PrismaService) => new PrismaWeeklyConfigRepository(p),
      inject: [PrismaService],
    },
    {
      provide: WeeklyPackageRepository,
      useFactory: (p: PrismaService) => new PrismaWeeklyPackageRepository(p),
      inject: [PrismaService],
    },
    {
      provide: UserProfileRepository,
      useFactory: (p: PrismaService) => new PrismaUserProfileRepository(p),
      inject: [PrismaService],
    },
    // Guards
    {
      provide: RolesGuard,
      useFactory: (r: Reflector, u: UserProfileRepository) =>
        new RolesGuard(r, u),
      inject: [Reflector, UserProfileRepository],
    },
    // Use Cases
    {
      provide: CreateOrderUseCase,
      useFactory: (o: OrderRepository, w: WeeklyConfigRepository) =>
        new CreateOrderUseCase(o, w),
      inject: [OrderRepository, WeeklyConfigRepository],
    },
    {
      provide: UpsertDailySelectionUseCase,
      useFactory: (
        o: OrderRepository,
        i: OrderItemRepository,
        w: WeeklyConfigRepository,
        p: WeeklyPackageRepository,
      ) => new UpsertDailySelectionUseCase(o, i, w, p),
      inject: [OrderRepository, OrderItemRepository, WeeklyConfigRepository, WeeklyPackageRepository],
    },
    {
      provide: RemoveOrderItemUseCase,
      useFactory: (
        o: OrderRepository,
        i: OrderItemRepository,
        w: WeeklyConfigRepository,
        p: WeeklyPackageRepository,
      ) => new RemoveOrderItemUseCase(o, i, w, p),
      inject: [OrderRepository, OrderItemRepository, WeeklyConfigRepository, WeeklyPackageRepository],
    },
    {
      provide: ApplyWeeklyPackageUseCase,
      useFactory: (
        o: OrderRepository,
        p: WeeklyPackageRepository,
        i: OrderItemRepository,
        w: WeeklyConfigRepository,
      ) => new ApplyWeeklyPackageUseCase(o, p, i, w),
      inject: [OrderRepository, WeeklyPackageRepository, OrderItemRepository, WeeklyConfigRepository],
    },
    {
      provide: InitiateCheckoutUseCase,
      useFactory: (
        o: OrderRepository,
        w: WeeklyConfigRepository,
        p: WeeklyPackageRepository,
      ) => new InitiateCheckoutUseCase(o, w, p),
      inject: [
        OrderRepository,
        WeeklyConfigRepository,
        WeeklyPackageRepository,
      ],
    },
    {
      provide: CancelOrderUseCase,
      useFactory: (o: OrderRepository) => new CancelOrderUseCase(o),
      inject: [OrderRepository],
    },
    {
      provide: DeleteDraftOrderUseCase,
      useFactory: (o: OrderRepository) => new DeleteDraftOrderUseCase(o),
      inject: [OrderRepository],
    },
    {
      provide: ListUserOrdersUseCase,
      useFactory: (o: OrderRepository) => new ListUserOrdersUseCase(o),
      inject: [OrderRepository],
    },
    {
      provide: GetOrderDetailUseCase,
      useFactory: (o: OrderRepository) => new GetOrderDetailUseCase(o),
      inject: [OrderRepository],
    },
  ],
  controllers: [OrdersController],
})
export class OrdersModule {}
