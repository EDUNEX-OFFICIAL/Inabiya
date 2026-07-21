import { Global, Module } from '@nestjs/common';
import { NotificationsQueueService } from './notifications-queue.service';

@Global()
@Module({
  providers: [NotificationsQueueService],
  exports: [NotificationsQueueService],
})
export class NotificationsQueueModule {}
