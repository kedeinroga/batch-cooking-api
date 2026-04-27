import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { DishType } from '@batch-cooking/domain';

export class CreateCatalogDishRequestDto {
  @ApiProperty({ example: '2026-W16' })
  @IsString()
  @Matches(/^\d{4}-W\d{2}$/, { message: 'Format must be YYYY-WNN' })
  weekIdentifier: string;

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
