import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import {
  CampaignsAuthController,
  CampaignsPublicController,
} from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [IdentityModule, AuditModule],
  controllers: [CampaignsPublicController, CampaignsAuthController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
