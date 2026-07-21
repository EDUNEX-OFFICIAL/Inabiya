import { Module } from '@nestjs/common';
import { PaymentsModule } from '../../../infrastructure/payments/payments.module';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { CartModule } from '../cart/cart.module';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { CheckoutController, PaymentWebhookController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PaymentFulfillmentService } from './payment-fulfillment.service';
import { PendingPaymentScheduler } from './pending-payment.scheduler';

@Module({
  imports: [
    IdentityModule,
    CartModule,
    InventoryModule,
    PromotionsModule,
    CustomersModule,
    PaymentsModule,
    AuditModule,
  ],
  controllers: [CheckoutController, PaymentWebhookController],
  providers: [CheckoutService, PaymentFulfillmentService, PendingPaymentScheduler],
  exports: [CheckoutService, PaymentFulfillmentService],
})
export class CheckoutModule {}
