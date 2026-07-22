import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { ProfilesAuthController, ProfilesPublicController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [IdentityModule, AuditModule],
  controllers: [ProfilesPublicController, ProfilesAuthController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
