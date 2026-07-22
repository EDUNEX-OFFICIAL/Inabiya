import { Module } from '@nestjs/common';
import { PaymentsModule } from '../../../infrastructure/payments/payments.module';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { OpsModule } from '../ops/ops.module';
import {
  ReturnsAdminController,
  ReturnsCustomerController,
  ReturnsPolicyController,
} from './returns.controller';
import { ReturnsService } from './returns.service';

@Module({
  imports: [IdentityModule, AuditModule, PaymentsModule, OpsModule],
  controllers: [ReturnsPolicyController, ReturnsCustomerController, ReturnsAdminController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
