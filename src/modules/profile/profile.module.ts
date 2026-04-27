import { Module } from '@nestjs/common';
import {
  ConfigModule,
  PrismaModule,
  PrismaService,
  PrismaUserProfileRepository,
} from '@batch-cooking/infrastructure';
import { UserProfileRepository } from '@batch-cooking/domain-services';
import { GetProfileUseCase } from '@batch-cooking/use-cases';
import { Reflector } from '@nestjs/core';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ProfileController } from './profile.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    Reflector,
    SupabaseJwtGuard,
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
      provide: GetProfileUseCase,
      useFactory: (u: UserProfileRepository) => new GetProfileUseCase(u),
      inject: [UserProfileRepository],
    },
  ],
  controllers: [ProfileController],
})
export class ProfileModule {}
