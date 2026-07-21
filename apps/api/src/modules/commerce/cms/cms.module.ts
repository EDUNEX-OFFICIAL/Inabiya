import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { IdentityModule } from '../../identity/identity.module';
import { CatalogModule } from '../catalog/catalog.module';
import {
  CmsPagesAdminController,
  CmsPagesPublicController,
} from './cms-pages.controller';
import { CmsPagesService } from './cms-pages.service';

@Module({
  imports: [AuditModule, IdentityModule, CatalogModule],
  controllers: [CmsPagesPublicController, CmsPagesAdminController],
  providers: [CmsPagesService],
  exports: [CmsPagesService],
})
export class CmsModule {}
