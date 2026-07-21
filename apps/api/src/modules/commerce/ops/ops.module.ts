import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { CartModule } from '../cart/cart.module';
import { CustomersModule } from '../customers/customers.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CommercePolicyService } from './commerce-policy.service';
import { OpsDashboardService } from './ops-dashboard.service';
import { OpsAdminController, StorefrontPublicController } from './ops.controller';
import { StorefrontConfigService } from './storefront-config.service';

@Module({
  imports: [
    IdentityModule,
    AuditModule,
    PromotionsModule,
    CustomersModule,
    CartModule,
    AnalyticsModule,
  ],
  controllers: [OpsAdminController, StorefrontPublicController],
  providers: [OpsDashboardService, StorefrontConfigService, CommercePolicyService],
  exports: [StorefrontConfigService, CommercePolicyService],
})
export class OpsModule {}
