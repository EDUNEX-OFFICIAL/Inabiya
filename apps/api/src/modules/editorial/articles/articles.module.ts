import { Module } from '@nestjs/common';
import { NotificationsQueueModule } from '../../../infrastructure/notifications/notifications-queue.module';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { AssignmentDueReminderScheduler } from './assignment-due-reminder.scheduler';

@Module({
  imports: [IdentityModule, AuditModule, NotificationsQueueModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, AssignmentDueReminderScheduler],
  exports: [ArticlesService],
})
export class ArticlesModule {}
