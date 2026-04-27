import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@batch-cooking/domain';
import {
  UpsertWeeklyConfigUseCase,
  ToggleDeliveryZoneUseCase,
  CleanupExpiredVouchersUseCase,
} from '@batch-cooking/use-cases';
import { ICustomRequest } from '../../shared/interfaces/request.interface';
import { UpsertWeeklyConfigRequestDto } from './dto/upsert-weekly-config.request.dto';
import { ToggleDeliveryZoneRequestDto } from './dto/toggle-delivery-zone.request.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(SupabaseJwtGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly upsertWeeklyConfigUseCase: UpsertWeeklyConfigUseCase,
    private readonly toggleDeliveryZoneUseCase: ToggleDeliveryZoneUseCase,
    private readonly cleanupExpiredVouchersUseCase: CleanupExpiredVouchersUseCase,
  ) {}

  @ApiOperation({
    summary: 'Create or update weekly config (ADMIN)',
    operationId: 'upsertWeeklyConfig',
  })
  @Roles(UserRole.ADMIN)
  @Put('weekly-configs')
  upsertWeeklyConfig(
    @Req() req: ICustomRequest,
    @Body() body: UpsertWeeklyConfigRequestDto,
  ) {
    return this.upsertWeeklyConfigUseCase.execute({
      ...body,
      startDate: new Date(body.startDate),
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Toggle a delivery zone active/inactive (ADMIN)',
    operationId: 'toggleDeliveryZone',
  })
  @Roles(UserRole.ADMIN)
  @Patch('delivery-zones/:zoneId')
  toggleDeliveryZone(
    @Req() req: ICustomRequest,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Body() body: ToggleDeliveryZoneRequestDto,
  ) {
    return this.toggleDeliveryZoneUseCase.execute({
      zoneId,
      isActive: body.isActive,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Clean up expired vouchers from GCS (ADMIN)',
    operationId: 'cleanupExpiredVouchers',
  })
  @Roles(UserRole.ADMIN)
  @Post('cleanup-vouchers')
  @HttpCode(HttpStatus.OK)
  cleanupExpiredVouchers(@Req() req: ICustomRequest) {
    return this.cleanupExpiredVouchersUseCase.execute({
      traceId: req.globalTraceId,
    });
  }
}
