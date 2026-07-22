import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsQueueService } from '../../../infrastructure/notifications/notifications-queue.service';
import { ArticlesService } from './articles.service';

@Injectable()
export class AssignmentDueReminderScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AssignmentDueReminderScheduler.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly articles: ArticlesService,
    private readonly notifications: NotificationsQueueService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(
      () => {
        void this.articles
          .scanDueReminders((job) => this.notifications.enqueueAssignmentDueReminder(job))
          .catch((err) => this.logger.warn(`due reminder scan failed: ${String(err)}`));
      },
      30 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
