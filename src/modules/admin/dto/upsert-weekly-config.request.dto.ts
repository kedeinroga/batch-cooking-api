import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpsertWeeklyConfigRequestDto {
  @ApiProperty({ example: '2026-W16' })
  @IsString()
  @Matches(/^\d{4}-W\d{2}$/, { message: 'Format must be YYYY-WNN' })
  weekIdentifier: string;

  @ApiProperty({ example: '2026-04-13T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: 50,
    description: 'Max number of orders for the week',
  })
  @IsInt()
  @IsPositive()
  maxOrders: number;

  @ApiProperty({
    example: 10,
    description: 'General discount percentage (0–100)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
