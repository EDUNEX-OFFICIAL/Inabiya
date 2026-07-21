import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { CustomerAdminService } from './customer-admin.service';

@Module({
  imports: [IdentityModule, AuditModule],
  controllers: [AddressController],
  providers: [AddressService, CustomerAdminService],
  exports: [AddressService, CustomerAdminService],
})
export class CustomersModule {}
