import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { CartModule } from '../cart/cart.module';
import { CustomersModule } from '../customers/customers.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CommercePolicyService } from './commerce-policy.service';
import { OpsDashboardService } from './ops-dashboard.service';
import {
  OpsAdminController,
  GiftChromePublicController,
  TrustCuesPublicController,
  StorefrontTrackingPublicController,
} from './ops.controller';
import { StorefrontConfigService } from './storefront-config.service';
import { TrackingTagsService } from './tracking-tags.service';

@Module({
  imports: [
    IdentityModule,
    AuditModule,
    PromotionsModule,
    CustomersModule,
    CartModule,
    AnalyticsModule,
  ],
  controllers: [
    OpsAdminController,
    GiftChromePublicController,
    TrustCuesPublicController,
    StorefrontTrackingPublicController,
  ],
  providers: [
    OpsDashboardService,
    StorefrontConfigService,
    CommercePolicyService,
    TrackingTagsService,
  ],
  exports: [StorefrontConfigService, CommercePolicyService, TrackingTagsService],
})
export class OpsModule {}
