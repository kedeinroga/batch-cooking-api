import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@batch-cooking/domain';
import { GetProfileUseCase } from '@batch-cooking/use-cases';
import { ICustomRequest } from '../../shared/interfaces/request.interface';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(SupabaseJwtGuard, RolesGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly getProfileUseCase: GetProfileUseCase) {}

  @ApiOperation({
    summary: 'Get current user profile and role',
    operationId: 'getMyProfile',
  })
  @Roles(UserRole.CLIENT, UserRole.STAFF, UserRole.ADMIN)
  @Get('me')
  getMyProfile(@Req() req: ICustomRequest) {
    return this.getProfileUseCase.execute({
      userId: req.user.id,
      traceId: req.globalTraceId,
    });
  }
}
