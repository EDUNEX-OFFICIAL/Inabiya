import { Module } from '@nestjs/common';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaymentsService } from './payments.service';

@Module({
  providers: [MockPaymentProvider, PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
