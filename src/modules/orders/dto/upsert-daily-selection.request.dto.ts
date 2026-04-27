import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { MealType } from '@batch-cooking/domain';

export class UpsertDailySelectionRequestDto {
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
