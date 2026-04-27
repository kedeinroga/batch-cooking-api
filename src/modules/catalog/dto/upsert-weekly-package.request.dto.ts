import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MealType } from '@batch-cooking/domain';

export class PackageItemDto {
  @ApiProperty({ description: '1=Monday … 5=Friday', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  dayOfWeek: number;

  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiProperty()
  @IsUUID()
  dishId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sideId?: string;
}

export class UpsertWeeklyPackageRequestDto {
  @ApiPropertyOptional({ description: 'Omit to create, provide to update' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: '2026-W16' })
  @IsString()
  @Matches(/^\d{4}-W\d{2}$/, { message: 'Format must be YYYY-WNN' })
  weekIdentifier: string;

  @ApiProperty({ example: 'Paquete Fitness' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 15, description: 'Discount percentage (0–100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @ApiProperty({ type: [PackageItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  items: PackageItemDto[];
}
