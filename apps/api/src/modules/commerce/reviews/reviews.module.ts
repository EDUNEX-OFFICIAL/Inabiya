import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { ReviewsAdminController, ReviewsPublicController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [IdentityModule, AuditModule],
  controllers: [ReviewsPublicController, ReviewsAdminController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
