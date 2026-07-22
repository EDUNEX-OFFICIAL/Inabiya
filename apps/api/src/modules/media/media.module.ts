import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { IdentityModule } from '../identity/identity.module';
import { MediaController, MediaPublicController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [AuditModule, IdentityModule],
  controllers: [MediaPublicController, MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
