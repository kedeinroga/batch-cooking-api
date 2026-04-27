import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@batch-cooking/domain';
import {
  GenerateVoucherUploadUrlUseCase,
  ConfirmVoucherUploadUseCase,
  ConfirmPaymentUseCase,
} from '@batch-cooking/use-cases';
import { ICustomRequest } from '../../shared/interfaces/request.interface';
import { ConfirmVoucherUploadRequestDto } from './dto/confirm-voucher-upload.request.dto';

@ApiTags('Payments')
@Controller('orders')
@UseGuards(SupabaseJwtGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private readonly generateVoucherUploadUrlUseCase: GenerateVoucherUploadUrlUseCase,
    private readonly confirmVoucherUploadUseCase: ConfirmVoucherUploadUseCase,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
  ) {}

  @ApiOperation({
    summary: 'Get a signed URL to upload a payment voucher',
    operationId: 'getVoucherUploadUrl',
  })
  @Roles(UserRole.CLIENT)
  @Post(':orderId/voucher-upload-url')
  getVoucherUploadUrl(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.generateVoucherUploadUrlUseCase.execute({
      userId: req.user.id,
      orderId,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Confirm voucher was uploaded to GCS',
    operationId: 'confirmVoucherUpload',
  })
  @Roles(UserRole.CLIENT)
  @Post(':orderId/confirm-voucher')
  @HttpCode(HttpStatus.OK)
  confirmVoucherUpload(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: ConfirmVoucherUploadRequestDto,
  ) {
    return this.confirmVoucherUploadUseCase.execute({
      userId: req.user.id,
      orderId,
      objectName: body.objectName,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Confirm payment (STAFF)',
    operationId: 'confirmPayment',
  })
  @Roles(UserRole.STAFF)
  @Post(':orderId/confirm-payment')
  @HttpCode(HttpStatus.OK)
  confirmPayment(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.confirmPaymentUseCase.execute({
      orderId,
      traceId: req.globalTraceId,
    });
  }
}
