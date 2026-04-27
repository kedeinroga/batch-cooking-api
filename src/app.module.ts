import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { LoggerMiddleware } from './shared/middleware/logger.middleware';
import { ConfigModule } from '@batch-cooking/infrastructure';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OperationsModule } from './modules/operations/operations.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProfileModule } from './modules/profile/profile.module';
import { DeliveryAddressesModule } from './modules/delivery-addresses/delivery-addresses.module';

@Module({
  imports: [
    ConfigModule,
    OrdersModule,
    PaymentsModule,
    CatalogModule,
    OperationsModule,
    AdminModule,
    ProfileModule,
    DeliveryAddressesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
