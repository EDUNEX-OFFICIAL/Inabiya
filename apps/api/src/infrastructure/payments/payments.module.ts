import { Module } from '@nestjs/common';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaymentsService } from './payments.service';
import { RazorpayPaymentProvider } from './razorpay-payment.provider';

@Module({
  providers: [MockPaymentProvider, RazorpayPaymentProvider, PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
