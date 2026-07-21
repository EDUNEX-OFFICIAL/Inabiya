import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { WriterPaymentsController } from './writer-payments.controller';
import { WriterPaymentsService } from './writer-payments.service';

@Module({
  imports: [IdentityModule, AuditModule],
  controllers: [WriterPaymentsController],
  providers: [WriterPaymentsService],
  exports: [WriterPaymentsService],
})
export class WriterPaymentsModule {}
