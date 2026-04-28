import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { MealType } from '@batch-cooking/domain';
import { ICustomRequest } from '../../shared/interfaces/request.interface';
import { CreateOrderRequestDto } from './dto/create-order.request.dto';
import { UpsertDailySelectionRequestDto } from './dto/upsert-daily-selection.request.dto';
import { ApplyWeeklyPackageRequestDto } from './dto/apply-weekly-package.request.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(SupabaseJwtGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly upsertDailySelectionUseCase: UpsertDailySelectionUseCase,
    private readonly removeOrderItemUseCase: RemoveOrderItemUseCase,
    private readonly applyWeeklyPackageUseCase: ApplyWeeklyPackageUseCase,
    private readonly initiateCheckoutUseCase: InitiateCheckoutUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly deleteDraftOrderUseCase: DeleteDraftOrderUseCase,
    private readonly listUserOrdersUseCase: ListUserOrdersUseCase,
    private readonly getOrderDetailUseCase: GetOrderDetailUseCase,
  ) {}

  @ApiOperation({
    summary: 'List my orders for a given week',
    operationId: 'listUserOrders',
  })
  @ApiQuery({
    name: 'week',
    example: '2026-W16',
    description: 'Week identifier (YYYY-WNN)',
  })
  @Roles(UserRole.CLIENT)
  @Get()
  listUserOrders(@Req() req: ICustomRequest, @Query('week') week: string) {
    return this.listUserOrdersUseCase.execute({
      userId: req.user.id,
      weekIdentifier: week,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Get order detail with items',
    operationId: 'getOrderDetail',
  })
  @Roles(UserRole.CLIENT)
  @Get(':orderId')
  getOrderDetail(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.getOrderDetailUseCase.execute({
      userId: req.user.id,
      orderId,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Create a new DRAFT order',
    operationId: 'createOrder',
  })
  @Roles(UserRole.CLIENT)
  @Post()
  createOrder(@Req() req: ICustomRequest, @Body() body: CreateOrderRequestDto) {
    return this.createOrderUseCase.execute({
      userId: req.user.id,
      weekIdentifier: body.weekIdentifier,
      deliveryAddressId: body.deliveryAddressId,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Upsert a daily dish selection',
    operationId: 'upsertDailySelection',
  })
  @Roles(UserRole.CLIENT)
  @Patch(':orderId/items')
  upsertDailySelection(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: UpsertDailySelectionRequestDto,
  ) {
    return this.upsertDailySelectionUseCase.execute({
      userId: req.user.id,
      orderId,
      ...body,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Remove a single daily selection from a DRAFT order',
    operationId: 'removeOrderItem',
  })
  @Roles(UserRole.CLIENT)
  @Delete(':orderId/items/:day/:meal')
  @HttpCode(HttpStatus.OK)
  removeOrderItem(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('day', ParseIntPipe) day: number,
    @Param('meal', new ParseEnumPipe(MealType)) meal: MealType,
  ) {
    return this.removeOrderItemUseCase.execute({
      userId: req.user.id,
      orderId,
      dayOfWeek: day,
      mealType: meal,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Apply a pre-built weekly package to an order',
    operationId: 'applyWeeklyPackage',
  })
  @Roles(UserRole.CLIENT)
  @Patch(':orderId/package')
  applyWeeklyPackage(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() body: ApplyWeeklyPackageRequestDto,
  ) {
    return this.applyWeeklyPackageUseCase.execute({
      userId: req.user.id,
      orderId,
      packageId: body.packageId,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Initiate checkout (locks capacity and calculates total)',
    operationId: 'initiateCheckout',
  })
  @Roles(UserRole.CLIENT)
  @Post(':orderId/checkout')
  @HttpCode(HttpStatus.OK)
  initiateCheckout(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.initiateCheckoutUseCase.execute({
      userId: req.user.id,
      orderId,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({ summary: 'Cancel an order', operationId: 'cancelOrder' })
  @Roles(UserRole.CLIENT)
  @Patch(':orderId/cancel')
  cancelOrder(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.cancelOrderUseCase.execute({
      userId: req.user.id,
      orderId,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Delete a DRAFT order',
    operationId: 'deleteDraftOrder',
  })
  @Roles(UserRole.CLIENT)
  @Delete(':orderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDraftOrder(
    @Req() req: ICustomRequest,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    await this.deleteDraftOrderUseCase.execute({
      userId: req.user.id,
      orderId,
      traceId: req.globalTraceId,
    });
  }
}
