import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ApplyWeeklyPackageRequestDto {
  @ApiProperty()
  @IsUUID()
  packageId: string;
}
