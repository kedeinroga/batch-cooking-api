import { Module } from '@nestjs/common';
import { ConfigModule } from './config.module';
import { GcpStorageService } from './gcp-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [GcpStorageService],
  exports: [GcpStorageService],
})
export class GcpStorageModule {}
