import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { ArticlesModule } from './articles/articles.module';
import { ReviewWorkflowModule } from './review-workflow/review-workflow.module';
import { PublishingModule } from './publishing/publishing.module';
import { WriterPaymentsModule } from './writer-payments/writer-payments.module';

/** Editorial domain aggregator — Phase 0 empty scaffolds only. */
@Module({
  imports: [
    AssignmentsModule,
    ArticlesModule,
    ReviewWorkflowModule,
    PublishingModule,
    WriterPaymentsModule,
  ],
})
export class EditorialModule {}
