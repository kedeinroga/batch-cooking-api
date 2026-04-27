import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches } from 'class-validator';

export class CreateOrderRequestDto {
  @ApiProperty({ example: '2026-W16' })
  @IsString()
  @Matches(/^\d{4}-W\d{2}$/, { message: 'Format must be YYYY-WNN' })
  weekIdentifier: string;

  @ApiProperty({ example: 'uuid-of-delivery-address' })
  @IsUUID()
  deliveryAddressId: string;
}
