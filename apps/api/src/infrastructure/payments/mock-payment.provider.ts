import { Injectable } from '@nestjs/common';
import type { PaymentIntent, PaymentProvider, PaymentRefund } from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  /** In-memory refund claim — prevents double mock refund for same paymentId. */
  private readonly refunded = new Set<string>();

  async createIntent(input: {
    paymentId: string;
    orderId: string;
    orderNumber: string;
    amountPaise: number;
  }): Promise<PaymentIntent> {
    const appUrl = (process.env.APP_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
    return {
      paymentId: input.paymentId,
      provider: this.name,
      amountPaise: input.amountPaise,
      confirmUrl: `${appUrl}/checkout/complete?paymentId=${input.paymentId}`,
    };
  }

  async refund(input: {
    paymentId: string;
    amountPaise: number;
    providerPaymentId?: string | null;
  }): Promise<PaymentRefund> {
    if (this.refunded.has(input.paymentId)) {
      return {
        refundId: `mock_rfnd_${input.paymentId}`,
        paymentId: input.paymentId,
        amountPaise: input.amountPaise,
        provider: this.name,
      };
    }
    this.refunded.add(input.paymentId);
    return {
      refundId: `mock_rfnd_${input.paymentId}`,
      paymentId: input.paymentId,
      amountPaise: input.amountPaise,
      provider: this.name,
    };
  }
}
