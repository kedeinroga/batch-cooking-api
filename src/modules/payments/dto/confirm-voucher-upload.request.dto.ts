import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConfirmVoucherUploadRequestDto {
  @ApiProperty({
    description: 'GCS object name returned by the upload URL endpoint',
  })
  @IsString()
  @MinLength(1)
  objectName: string;
}
