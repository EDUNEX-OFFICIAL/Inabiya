import { Module } from '@nestjs/common';
import { ProfilesModule } from './profiles/profiles.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ProposalsModule } from './proposals/proposals.module';
import { MessagingModule } from './messaging/messaging.module';
import { DeliverablesModule } from './deliverables/deliverables.module';
import { CampaignPaymentsModule } from './campaign-payments/campaign-payments.module';

/** Creator Collective domain aggregator — Phase 8 live in Profiles + Campaigns. */
@Module({
  imports: [
    ProfilesModule,
    CampaignsModule,
    ProposalsModule,
    MessagingModule,
    DeliverablesModule,
    CampaignPaymentsModule,
  ],
})
export class CreatorModule {}
