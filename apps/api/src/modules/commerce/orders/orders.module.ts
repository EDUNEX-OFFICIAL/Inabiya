import { Module } from '@nestjs/common';
import { PaymentsModule } from '../../../infrastructure/payments/payments.module';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { OrdersAdminController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [IdentityModule, AuditModule, PaymentsModule],
  controllers: [OrdersController, OrdersAdminController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
