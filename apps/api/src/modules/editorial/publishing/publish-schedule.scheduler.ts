import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PublishingService } from './publishing.service';

@Injectable()
export class PublishScheduleScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublishScheduleScheduler.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly publishing: PublishingService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.publishing
        .processDueSchedules()
        .then((r) => {
          if (r.published > 0) {
            this.logger.log(`Published ${r.published} scheduled article(s)`);
          }
        })
        .catch((err) => this.logger.warn(`schedule scan failed: ${String(err)}`));
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
