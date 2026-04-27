import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  ListDeliveryZonesUseCase,
  ListDeliveryAddressesUseCase,
  CreateDeliveryAddressUseCase,
  UpdateDeliveryAddressUseCase,
  DeleteDeliveryAddressUseCase,
} from '@batch-cooking/use-cases';
import { ICustomRequest } from '../../shared/interfaces/request.interface';
import { CreateDeliveryAddressRequestDto } from './dto/create-delivery-address.request.dto';
import { UpdateDeliveryAddressRequestDto } from './dto/update-delivery-address.request.dto';

@ApiTags('Delivery')
@Controller()
@UseGuards(SupabaseJwtGuard, RolesGuard)
@ApiBearerAuth()
export class DeliveryAddressesController {
  constructor(
    private readonly listDeliveryZonesUseCase: ListDeliveryZonesUseCase,
    private readonly listDeliveryAddressesUseCase: ListDeliveryAddressesUseCase,
    private readonly createDeliveryAddressUseCase: CreateDeliveryAddressUseCase,
    private readonly updateDeliveryAddressUseCase: UpdateDeliveryAddressUseCase,
    private readonly deleteDeliveryAddressUseCase: DeleteDeliveryAddressUseCase,
  ) {}

  @ApiOperation({
    summary: 'List active delivery zones',
    operationId: 'listDeliveryZones',
  })
  @Roles(UserRole.CLIENT)
  @Get('delivery-zones')
  listDeliveryZones(@Req() req: ICustomRequest) {
    return this.listDeliveryZonesUseCase.execute({
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'List my delivery addresses',
    operationId: 'listDeliveryAddresses',
  })
  @Roles(UserRole.CLIENT)
  @Get('delivery-addresses')
  listDeliveryAddresses(@Req() req: ICustomRequest) {
    return this.listDeliveryAddressesUseCase.execute({
      userId: req.user.id,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Create a delivery address',
    operationId: 'createDeliveryAddress',
  })
  @Roles(UserRole.CLIENT)
  @Post('delivery-addresses')
  createDeliveryAddress(
    @Req() req: ICustomRequest,
    @Body() body: CreateDeliveryAddressRequestDto,
  ) {
    return this.createDeliveryAddressUseCase.execute({
      userId: req.user.id,
      label: body.label,
      addressLine: body.addressLine,
      districtId: body.districtId,
      reference: body.reference,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Update a delivery address',
    operationId: 'updateDeliveryAddress',
  })
  @Roles(UserRole.CLIENT)
  @Put('delivery-addresses/:addressId')
  updateDeliveryAddress(
    @Req() req: ICustomRequest,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() body: UpdateDeliveryAddressRequestDto,
  ) {
    return this.updateDeliveryAddressUseCase.execute({
      userId: req.user.id,
      addressId,
      label: body.label,
      addressLine: body.addressLine,
      districtId: body.districtId,
      reference: body.reference,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Delete a delivery address',
    operationId: 'deleteDeliveryAddress',
  })
  @Roles(UserRole.CLIENT)
  @Delete('delivery-addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDeliveryAddress(
    @Req() req: ICustomRequest,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    await this.deleteDeliveryAddressUseCase.execute({
      userId: req.user.id,
      addressId,
      traceId: req.globalTraceId,
    });
  }
}
