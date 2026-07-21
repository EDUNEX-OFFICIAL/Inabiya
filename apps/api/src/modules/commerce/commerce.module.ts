import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { OrdersModule } from './orders/orders.module';
import { PromotionsModule } from './promotions/promotions.module';
import { CustomersModule } from './customers/customers.module';
import { OpsModule } from './ops/ops.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReturnsModule } from './returns/returns.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CmsModule } from './cms/cms.module';

/** Commerce domain aggregator */
@Module({
  imports: [
    CatalogModule,
    InventoryModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PromotionsModule,
    CustomersModule,
    OpsModule,
    ReviewsModule,
    ReturnsModule,
    AnalyticsModule,
    CmsModule,
  ],
})
export class CommerceModule {}
