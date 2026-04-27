import { Module } from '@nestjs/common';
import {
  ConfigModule,
  PrismaModule,
  PrismaService,
  PrismaDeliveryAddressRepository,
  PrismaDeliveryZoneRepository,
  PrismaUserProfileRepository,
} from '@batch-cooking/infrastructure';
import {
  DeliveryAddressRepository,
  DeliveryZoneRepository,
  UserProfileRepository,
} from '@batch-cooking/domain-services';
import {
  ListDeliveryZonesUseCase,
  ListDeliveryAddressesUseCase,
  CreateDeliveryAddressUseCase,
  UpdateDeliveryAddressUseCase,
  DeleteDeliveryAddressUseCase,
} from '@batch-cooking/use-cases';
import { Reflector } from '@nestjs/core';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { DeliveryAddressesController } from './delivery-addresses.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    Reflector,
    SupabaseJwtGuard,
    {
      provide: DeliveryAddressRepository,
      useFactory: (p: PrismaService) => new PrismaDeliveryAddressRepository(p),
      inject: [PrismaService],
    },
    {
      provide: DeliveryZoneRepository,
      useFactory: (p: PrismaService) => new PrismaDeliveryZoneRepository(p),
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
      provide: ListDeliveryZonesUseCase,
      useFactory: (z: DeliveryZoneRepository) =>
        new ListDeliveryZonesUseCase(z),
      inject: [DeliveryZoneRepository],
    },
    {
      provide: ListDeliveryAddressesUseCase,
      useFactory: (a: DeliveryAddressRepository) =>
        new ListDeliveryAddressesUseCase(a),
      inject: [DeliveryAddressRepository],
    },
    {
      provide: CreateDeliveryAddressUseCase,
      useFactory: (a: DeliveryAddressRepository, z: DeliveryZoneRepository) =>
        new CreateDeliveryAddressUseCase(a, z),
      inject: [DeliveryAddressRepository, DeliveryZoneRepository],
    },
    {
      provide: UpdateDeliveryAddressUseCase,
      useFactory: (a: DeliveryAddressRepository, z: DeliveryZoneRepository) =>
        new UpdateDeliveryAddressUseCase(a, z),
      inject: [DeliveryAddressRepository, DeliveryZoneRepository],
    },
    {
      provide: DeleteDeliveryAddressUseCase,
      useFactory: (a: DeliveryAddressRepository) =>
        new DeleteDeliveryAddressUseCase(a),
      inject: [DeliveryAddressRepository],
    },
  ],
  controllers: [DeliveryAddressesController],
})
export class DeliveryAddressesModule {}
