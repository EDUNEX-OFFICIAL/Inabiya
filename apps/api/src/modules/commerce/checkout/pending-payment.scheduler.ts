import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

/** Every 5 minutes: expire unpaid orders older than 30m (release stock + restore cart). */
@Injectable()
export class PendingPaymentScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PendingPaymentScheduler.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly fulfillment: PaymentFulfillmentService) {}

  onModuleInit() {
    const everyMs = 5 * 60 * 1000;
    this.timer = setInterval(() => {
      void this.fulfillment
        .expireStalePendingPayments()
        .then((r) => {
          if (r.expired > 0) {
            this.logger.log(`Expired ${r.expired} stale pending payment(s)`);
          }
        })
        .catch((err) => {
          this.logger.warn(`pending payment expire failed: ${String(err)}`);
        });
    }, everyMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
