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
  CreateCatalogDishUseCase,
  GetWeeklyMenuUseCase,
  UpsertWeeklyPackageUseCase,
  DeleteCatalogDishUseCase,
} from '@batch-cooking/use-cases';
import { ICustomRequest } from '../../shared/interfaces/request.interface';
import { CreateCatalogDishRequestDto } from './dto/create-catalog-dish.request.dto';
import { UpsertWeeklyPackageRequestDto } from './dto/upsert-weekly-package.request.dto';

@ApiTags('Catalog')
@Controller('catalog')
@UseGuards(SupabaseJwtGuard, RolesGuard)
@ApiBearerAuth()
export class CatalogController {
  constructor(
    private readonly createCatalogDishUseCase: CreateCatalogDishUseCase,
    private readonly getWeeklyMenuUseCase: GetWeeklyMenuUseCase,
    private readonly upsertWeeklyPackageUseCase: UpsertWeeklyPackageUseCase,
    private readonly deleteCatalogDishUseCase: DeleteCatalogDishUseCase,
  ) {}

  @ApiOperation({
    summary: 'Get the weekly menu (dishes + packages)',
    operationId: 'getWeeklyMenu',
  })
  @Roles(UserRole.CLIENT, UserRole.STAFF)
  @Get(':weekIdentifier')
  getWeeklyMenu(
    @Req() req: ICustomRequest,
    @Param('weekIdentifier') weekIdentifier: string,
  ) {
    return this.getWeeklyMenuUseCase.execute({
      weekIdentifier,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Create a dish in the weekly catalog (STAFF)',
    operationId: 'createCatalogDish',
  })
  @Roles(UserRole.STAFF)
  @Post('dishes')
  createCatalogDish(
    @Req() req: ICustomRequest,
    @Body() body: CreateCatalogDishRequestDto,
  ) {
    return this.createCatalogDishUseCase.execute({
      ...body,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Create or update a weekly package (STAFF)',
    operationId: 'upsertWeeklyPackage',
  })
  @Roles(UserRole.STAFF)
  @Put('packages')
  upsertWeeklyPackage(
    @Req() req: ICustomRequest,
    @Body() body: UpsertWeeklyPackageRequestDto,
  ) {
    return this.upsertWeeklyPackageUseCase.execute({
      ...body,
      traceId: req.globalTraceId,
    });
  }

  @ApiOperation({
    summary: 'Delete a catalog dish (STAFF)',
    operationId: 'deleteCatalogDish',
  })
  @Roles(UserRole.STAFF)
  @Delete('dishes/:dishId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCatalogDish(
    @Req() req: ICustomRequest,
    @Param('dishId', ParseUUIDPipe) dishId: string,
  ) {
    await this.deleteCatalogDishUseCase.execute({
      dishId,
      traceId: req.globalTraceId,
    });
  }
}
