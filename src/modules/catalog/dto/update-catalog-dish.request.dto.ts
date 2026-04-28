import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';
import { DishType } from '@batch-cooking/domain';

export class UpdateCatalogDishRequestDto {
  @ApiProperty({ example: 'Lomo Saltado' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: DishType })
  @IsEnum(DishType)
  type: DishType;

  @ApiProperty({ example: 18.5, description: 'Price in PEN, no rounding' })
  @IsNumber()
  @IsPositive()
  price: number;
}
