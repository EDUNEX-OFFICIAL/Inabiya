import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CartAbandonmentService } from './cart-abandonment.service';

/** Runs abandonment scan every 15 minutes while API is up. */
@Injectable()
export class CartAbandonmentScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CartAbandonmentScheduler.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly abandonment: CartAbandonmentService) {}

  onModuleInit() {
    const everyMs = 15 * 60 * 1000;
    this.timer = setInterval(() => {
      void this.abandonment.scanAndEnqueue(60).catch((err) => {
        this.logger.warn(`abandonment scan failed: ${String(err)}`);
      });
    }, everyMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
