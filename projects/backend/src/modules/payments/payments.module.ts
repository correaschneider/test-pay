import { Module } from '@nestjs/common';
import { AsaasPaymentAdapter } from '../../shared/asaas/asaas-payment.adapter';
import { AsaasModule } from '../../shared/asaas/asaas.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AsaasModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'PaymentGateway',
      useClass: AsaasPaymentAdapter,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
