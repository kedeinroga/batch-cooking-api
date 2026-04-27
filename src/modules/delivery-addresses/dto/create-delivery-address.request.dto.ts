import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDeliveryAddressRequestDto {
  @ApiProperty({ example: 'Casa' })
  @IsString()
  @MaxLength(100)
  label: string;

  @ApiProperty({ example: 'Av. Larco 123, Miraflores' })
  @IsString()
  @MaxLength(255)
  addressLine: string;

  @ApiProperty({ description: 'UUID of an active delivery zone' })
  @IsUUID()
  districtId: string;

  @ApiPropertyOptional({ example: 'Frente al parque' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;
}
