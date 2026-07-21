export type PaymentIntent = {
  paymentId: string;
  provider: string;
  amountPaise: number;
  confirmUrl: string;
};

export type PaymentRefund = {
  refundId: string;
  paymentId: string;
  amountPaise: number;
  provider: string;
};

export interface PaymentProvider {
  readonly name: string;
  createIntent(input: {
    paymentId: string;
    orderId: string;
    orderNumber: string;
    amountPaise: number;
  }): Promise<PaymentIntent>;
  refund(input: {
    paymentId: string;
    amountPaise: number;
    providerPaymentId?: string | null;
  }): Promise<PaymentRefund>;
}
