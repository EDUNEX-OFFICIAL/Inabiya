import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { OpsModule } from '../ops/ops.module';
import { InventoryAdminController } from './inventory-admin.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [IdentityModule, AuditModule, OpsModule],
  controllers: [InventoryAdminController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
