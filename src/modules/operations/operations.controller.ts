import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@batch-cooking/domain';
import {
  MarkOrderAsDeliveredUseCase,
  GetVoucherSignedUrlUseCase,
  GenerateProductionReportUseCase,
  GetDeliveryListUseCase,
  ListPendingPaymentOrdersUseCase,
} from '@batch-cooking/use-cases';
import { ICustomRequest } from '../../shared/interfaces/request.interface';

@ApiTags('Operations')
@Controller('operations')
@UseGuards(SupabaseJwtGuard, RolesGuard)
@ApiBearerAuth()
export class OperationsController {
  constructor(
    private readonly markOrderAsDeliveredUseCase: MarkOrderAsDeliveredUseCase,
    private readonly getVoucherSignedUrlUseCase: GetVoucherSignedUrlUseCase,
    private readonly generateProductionReportUseCase: GenerateProductionReportUseCase,
    private readonly getDeliveryListUseCase: GetDeliveryListUseCase,
    private readonly listPendingPaymentOrdersUseCase: ListPendingPaymentOrdersUseCase,
  ) {}

  @ApiOperation({
    summary: 'Get signed URL to view a payment voucher (STAFF)',
    operationId: 'getVoucherSignedUrl',
  })
  @Roles(UserRole.STAFF)
  @Get('orders/:orderId/voucher')
  getVoucherSignedUrl(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.getVoucherSignedUrlUseCase.execute({
      orderId,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Mark an order as delivered (STAFF)',
    operationId: 'markOrderAsDelivered',
  })
  @Roles(UserRole.STAFF)
  @Post('orders/:orderId/deliver')
  @HttpCode(HttpStatus.OK)
  markOrderAsDelivered(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.markOrderAsDeliveredUseCase.execute({
      orderId,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Get production report for a week (STAFF)',
    operationId: 'getProductionReport',
  })
  @ApiQuery({ name: 'week', example: '2026-W16' })
  @Roles(UserRole.STAFF)
  @Get('reports/production')
  getProductionReport(@Req() req: ICustomRequest, @Query('week') week: string) {
    return this.generateProductionReportUseCase.execute({
      weekIdentifier: week,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Get delivery list for a week (STAFF)',
    operationId: 'getDeliveryList',
  })
  @ApiQuery({ name: 'week', example: '2026-W16' })
  @Roles(UserRole.STAFF)
  @Get('reports/delivery')
  getDeliveryList(@Req() req: ICustomRequest, @Query('week') week: string) {
    return this.getDeliveryListUseCase.execute({
      weekIdentifier: week,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'List orders pending payment review (STAFF)',
    operationId: 'listPendingPaymentOrders',
  })
  @ApiQuery({ name: 'week', example: '2026-W16' })
  @Roles(UserRole.STAFF)
  @Get('orders/pending-payment')
  listPendingPaymentOrders(
    @Req() req: ICustomRequest,
    @Query('week') week: string,
  ) {
    return this.listPendingPaymentOrdersUseCase.execute({
      weekIdentifier: week,
      traceId: req.globalTraceId,
    });
  }
}
