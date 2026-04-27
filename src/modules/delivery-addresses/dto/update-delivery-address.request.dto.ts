import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateDeliveryAddressRequestDto {
  @ApiProperty({ example: 'Oficina' })
  @IsString()
  @MaxLength(100)
  label: string;

  @ApiProperty({ example: 'Calle Las Flores 456, San Isidro' })
  @IsString()
  @MaxLength(255)
  addressLine: string;

  @ApiProperty({ description: 'UUID of an active delivery zone' })
  @IsUUID()
  districtId: string;

  @ApiPropertyOptional({ example: 'Piso 3, oficina 302' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;
}
