import { Injectable } from '@nestjs/common';
import { MockPaymentProvider } from './mock-payment.provider';
import type {
  PaymentIntent,
  PaymentProvider,
  PaymentRefund,
} from './payment-provider.interface';

@Injectable()
export class PaymentsService {
  constructor(private readonly mock: MockPaymentProvider) {}

  getProvider(): PaymentProvider {
    const provider = (process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase();
    if (provider === 'mock') return this.mock;
    // ponytail: razorpay → add RazorpayPaymentProvider when Q2 resolves
    return this.mock;
  }

  createIntent(input: {
    paymentId: string;
    orderId: string;
    orderNumber: string;
    amountPaise: number;
  }): Promise<PaymentIntent> {
    return this.getProvider().createIntent(input);
  }

  refund(input: {
    paymentId: string;
    amountPaise: number;
    providerPaymentId?: string | null;
  }): Promise<PaymentRefund> {
    return this.getProvider().refund(input);
  }
}
