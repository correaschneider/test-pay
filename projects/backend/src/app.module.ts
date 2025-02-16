import { Module } from '@nestjs/common';
import { CustomersModule } from './modules/customers/customers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [PaymentsModule, CustomersModule, SharedModule],
})
export class AppModule {}
