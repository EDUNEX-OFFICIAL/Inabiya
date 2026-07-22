import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { PublishingAdminController, PublishingPublicController } from './publishing.controller';
import { PublishingService } from './publishing.service';
import { PublishScheduleScheduler } from './publish-schedule.scheduler';

@Module({
  imports: [IdentityModule, AuditModule],
  controllers: [PublishingPublicController, PublishingAdminController],
  providers: [PublishingService, PublishScheduleScheduler],
  exports: [PublishingService],
})
export class PublishingModule {}
