import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { OrdersModule } from './orders/orders.module';
import { PromotionsModule } from './promotions/promotions.module';
import { CustomersModule } from './customers/customers.module';

/** Commerce domain aggregator — Phase 0 empty scaffolds only. */
@Module({
  imports: [
    CatalogModule,
    InventoryModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    PromotionsModule,
    CustomersModule,
  ],
})
export class CommerceModule {}
