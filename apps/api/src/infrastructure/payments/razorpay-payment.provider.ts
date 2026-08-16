import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import type { PaymentIntent, PaymentProvider, PaymentRefund } from './payment-provider.interface';

@Injectable()
export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = 'razorpay';

  constructor(private readonly prisma: PrismaService) {}

  async createIntent(input: {
    paymentId: string;
    orderId: string;
    orderNumber: string;
    amountPaise: number;
  }): Promise<PaymentIntent> {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException({
        code: 'PAYMENT_PROVIDER_UNAVAILABLE',
        message: 'Razorpay is not configured.',
      });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.orderNumber,
      notes: { paymentId: input.paymentId, orderId: input.orderId },
    });

    await this.prisma.payment.update({
      where: { id: input.paymentId },
      data: { metadata: { razorpayOrderId: order.id } },
    });

    return {
      paymentId: input.paymentId,
      provider: this.name,
      amountPaise: input.amountPaise,
      confirmUrl: '',
      razorpay: { keyId, orderId: order.id },
    };
  }

  async refund(input: {
    paymentId: string;
    amountPaise: number;
    providerPaymentId?: string | null;
  }): Promise<PaymentRefund> {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret || !input.providerPaymentId) {
      throw new ServiceUnavailableException({
        code: 'PAYMENT_PROVIDER_UNAVAILABLE',
        message: 'Razorpay refund is not available for this payment.',
      });
    }
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const refund = await razorpay.payments.refund(input.providerPaymentId, {
      amount: input.amountPaise,
    });
    return {
      refundId: refund.id,
      paymentId: input.paymentId,
      amountPaise: input.amountPaise,
      provider: this.name,
    };
  }
}
